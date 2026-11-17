import { Car, Truck, Bus, Bike } from 'lucide-react';
import { VehicleClass } from '../types';

export interface VehicleClassConfig {
  name: 'Car' | 'Truck' | 'Bus' | 'Motorcycle' | 'Unknown';
  icon: typeof Car;
  textColor: string;
  badgeBorder: string;
  badgeBg: string;
  pillBg: string;
  accentColor: string;
}

export const getVehicleClassConfig = (vehicleClass?: VehicleClass | string): VehicleClassConfig => {
  const c = (vehicleClass || 'car').toLowerCase();
  
  if (c.includes('truck') || c.includes('track')) {
    return {
      name: 'Truck',
      icon: Truck,
      textColor: 'text-amber-800',
      badgeBorder: 'border-amber-300',
      badgeBg: 'bg-amber-50',
      pillBg: 'bg-amber-600',
      accentColor: '#d97706'
    };
  }
  
  if (c.includes('bus')) {
    return {
      name: 'Bus',
      icon: Bus,
      textColor: 'text-purple-800',
      badgeBorder: 'border-purple-300',
      badgeBg: 'bg-purple-50',
      pillBg: 'bg-purple-600',
      accentColor: '#9333ea'
    };
  }
  
  if (c.includes('motorcycle') || c.includes('bike') || c.includes('boda')) {
    return {
      name: 'Motorcycle',
      icon: Bike,
      textColor: 'text-emerald-800',
      badgeBorder: 'border-emerald-300',
      badgeBg: 'bg-emerald-50',
      pillBg: 'bg-emerald-600',
      accentColor: '#059669'
    };
  }

  if (!c || c === 'unknown') {
    return {
      name: 'Unknown',
      icon: Car,
      textColor: 'text-slate-700',
      badgeBorder: 'border-slate-300',
      badgeBg: 'bg-slate-50',
      pillBg: 'bg-slate-600',
      accentColor: '#475569'
    };
  }
  
  // Default to Car
  return {
    name: 'Car',
    icon: Car,
    textColor: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    badgeBg: 'bg-blue-50',
    pillBg: 'bg-blue-600',
    accentColor: '#2563eb'
  };
};
