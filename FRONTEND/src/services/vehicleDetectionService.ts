import { supabase } from '../lib/supabaseClient';
import { VehicleClass } from '../types';

export interface SupabaseDetectionRow {
  id: string;
  captured_at: string;
  vehicle_class: string;
  image_path: string;
}

export const resolveDetectionImage = (imageValue?: string): string | undefined => {
  if (!imageValue) return undefined;

  const value = imageValue.trim();
  if (!value) return undefined;
  if (/^(https?:|data:image\/|blob:)/i.test(value)) return value;
  if (value.startsWith('/storage/v1/object/')) {
    return new URL(value, import.meta.env.VITE_SUPABASE_URL).toString();
  }

  const storagePath = value.replace(/^\/+/, '').replace(/^vehicles-images\//, '');
  return supabase.storage.from('vehicles-images').getPublicUrl(storagePath).data.publicUrl;
};

export const normalizeVehicleClass = (rawClass?: string): VehicleClass => {
  const c = (rawClass || '').toLowerCase().trim();
  if (c.includes('truck') || c.includes('track')) return 'Truck';
  if (c.includes('bus')) return 'Bus';
  if (c.includes('motorcycle') || c.includes('bike') || c.includes('boda')) return 'Motorcycle';
  if (c === 'car') return 'Car';
  return 'Unknown';
};

const listStoredImages = async (prefix = '', depth = 0): Promise<Array<{ path: string; createdAt?: string }>> => {
  if (depth > 5) return [];

  const { data, error } = await supabase.storage.from('vehicles-images').list(prefix, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' }
  });
  if (error) {
    console.warn('Supabase Storage list error for vehicles-images:', error.message);
    return [];
  }

  const nested = await Promise.all(data.filter((item) => !item.id).map((folder) =>
    listStoredImages(`${prefix}${folder.name}/`, depth + 1)
  ));
  const files = data
    .filter((item) => item.id && (item.metadata?.mimetype?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(item.name)))
    .map((item) => ({
      path: `${prefix}${item.name}`,
      createdAt: item.created_at || item.updated_at || undefined
    }));

  return [...files, ...nested.flat()];
};

/**
 * Fetch latest ESP32-CAM captures from Supabase
 */
export async function fetchLiveDetections(): Promise<SupabaseDetectionRow[] | null> {
  try {
    const [{ data, error }, storedImages] = await Promise.all([
      supabase
      .from('vehicle_captures')
      .select('id, image_path, captured_at, vehicle_class')
      .order('captured_at', { ascending: false })
      .limit(100),
      listStoredImages()
    ]);

    if (error && storedImages.length === 0) {
      console.warn('Supabase fetch error for vehicle_captures:', error.message);
      return null;
    }

    const captureRows = (data || []) as SupabaseDetectionRow[];
    const recordedPaths = new Set(captureRows.map((row) => row.image_path.replace(/^\/+/, '').replace(/^vehicles-images\//, '')));
    const storageRows: SupabaseDetectionRow[] = storedImages
      .filter((image) => !recordedPaths.has(image.path))
      .map((image) => {
        const classFromName = image.path.match(/(motorcycle|truck|bus|car)/i)?.[0] || 'unknown';
        return {
          id: `storage:${image.path}`,
          image_path: image.path,
          captured_at: image.createdAt || new Date().toISOString(),
          vehicle_class: classFromName
        };
      });

    if (error) console.warn('Supabase fetch error for vehicle_captures:', error.message);
    return [...captureRows, ...storageRows]
      .sort((a, b) => Date.parse(b.captured_at) - Date.parse(a.captured_at))
      .slice(0, 100);
  } catch (err) {
    console.warn('Network error fetching vehicle detections from Supabase:', err);
    return null;
  }
}

/**
 * Subscribe to realtime vehicle captures from ESP32-CAM
 */
export function subscribeToLiveDetections(
  onDetectionEvent: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: SupabaseDetectionRow) => void
) {
  const channel = supabase
    .channel('esp32_vehicle_captures')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vehicle_captures'
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          onDetectionEvent(payload.eventType, payload.new as SupabaseDetectionRow);
        } else if (payload.eventType === 'DELETE') {
          onDetectionEvent('DELETE', payload.old as SupabaseDetectionRow);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
