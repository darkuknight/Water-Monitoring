import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Filter, Trash2, MapPin, Users, FlaskConical, Plus } from "lucide-react";

// Enhanced marker types
export type MarkerType = 'report' | 'water-test' | 'user-added';

export interface EnhancedLocationRisk {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  riskPercentage: number;
  timestamp: number;
  type: MarkerType;
  metadata?: {
    // For reports
    symptoms?: string[];
    affectedCount?: number;
    notes?: string;
    // For water tests
    kit?: string;
    overallRisk?: string;
    confidence?: number;
    criticalParameters?: number;
    totalParameters?: number;
    testDate?: string;
    // For user-added
    title?: string;
    description?: string;
    category?: string;
  };
}

export interface MarkerCluster {
  id: string;
  centerLat: number;
  centerLng: number;
  markers: EnhancedLocationRisk[];
  radius: number;
  averageRisk: number;
}

interface EnhancedRiskMapProps {
  locationRisks: EnhancedLocationRisk[];
  onRefresh?: () => void;
  onDeleteMarker?: (markerId: string) => Promise<void>;
  showControls?: boolean;
}

export default function EnhancedRiskMap({ 
  locationRisks, 
  onRefresh, 
  onDeleteMarker,
  showControls = true 
}: EnhancedRiskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>("");
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const clustersRef = useRef<Map<string, any>>(new Map());
  
  // Filter states
  const [showReports, setShowReports] = useState(true);
  const [showWaterTests, setShowWaterTests] = useState(true);
  const [showUserAdded, setShowUserAdded] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  
  // Deletion state
  const [selectedMarker, setSelectedMarker] = useState<EnhancedLocationRisk | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Add custom CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      }
      
      .leaflet-popup-tip {
        background: white;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Filter locations based on type and coordinates
  const getFilteredLocations = () => {
    const filtered = locationRisks.filter((loc) => {
      if (loc.latitude === undefined || loc.longitude === undefined) return false;
      
      if (loc.type === 'report' && !showReports) return false;
      if (loc.type === 'water-test' && !showWaterTests) return false;
      if (loc.type === 'user-added' && !showUserAdded) return false;
      
      return true;
    });
    
    return filtered;
  };

  // Create marker clusters for nearby markers
  const createClusters = (locations: EnhancedLocationRisk[]): MarkerCluster[] => {
    const clusters: MarkerCluster[] = [];
    const processed = new Set<string>();
    const clusterRadius = 0.01; // ~1km radius in degrees

    locations.forEach((location) => {
      if (processed.has(location.id)) return;

      const nearby = locations.filter((other) => {
        if (other.id === location.id || processed.has(other.id)) return false;
        
        const distance = Math.sqrt(
          Math.pow((location.latitude! - other.latitude!), 2) +
          Math.pow((location.longitude! - other.longitude!), 2)
        );
        
        return distance <= clusterRadius;
      });

      if (nearby.length >= 2) { // 3+ markers total (including original)
        const allMarkers = [location, ...nearby];
        
        // Mark all as processed
        allMarkers.forEach(marker => processed.add(marker.id));
        
        // Calculate cluster center and average risk
        const centerLat = allMarkers.reduce((sum, m) => sum + m.latitude!, 0) / allMarkers.length;
        const centerLng = allMarkers.reduce((sum, m) => sum + m.longitude!, 0) / allMarkers.length;
        const averageRisk = allMarkers.reduce((sum, m) => sum + m.riskPercentage, 0) / allMarkers.length;
        
        clusters.push({
          id: `cluster_${location.id}`,
          centerLat,
          centerLng,
          markers: allMarkers,
          radius: clusterRadius,
          averageRisk
        });
      }
    });

    return clusters;
  };

  const getMarkerIcon = (location: EnhancedLocationRisk, isSelected: boolean = false) => {
    const risk = location.riskPercentage;
    let color = risk >= 70 ? '#ef4444' : risk >= 40 ? '#f59e0b' : '#22c55e';
    let borderColor = 'white';
    
    if (isSelected) {
      borderColor = '#8b5cf6'; // Purple border for selected marker
    }

    // Different icons and shapes for different types with detailed info
    const getMarkerHtml = () => {
      const shadowStyle = 'box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
      
      switch (location.type) {
        case 'report':
          const affectedCount = location.metadata?.affectedCount || 0;
          return `
            <div style="position: relative;">
              <div style="
                background-color: ${color}; 
                width: 24px; height: 24px; 
                border: 2px solid ${borderColor}; 
                border-radius: 50%; 
                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                color: white; font-weight: bold;
                ${shadowStyle}
              ">
                <div style="font-size: 8px; line-height: 1;">R</div>
                <div style="font-size: 6px; line-height: 1;">${affectedCount}p</div>
              </div>
              ${isSelected ? '<div style="position: absolute; top: -2px; left: -2px; width: 28px; height: 28px; border: 2px solid #8b5cf6; border-radius: 50%; animation: pulse 2s infinite;"></div>' : ''}
            </div>`;
        case 'water-test':
          const criticalParams = location.metadata?.criticalParameters || 0;
          const totalParams = location.metadata?.totalParameters || 0;
          return `
            <div style="position: relative;">
              <div style="
                background-color: ${color}; 
                width: 24px; height: 24px; 
                border: 2px solid ${borderColor}; 
                border-radius: 15%; 
                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                color: white; font-weight: bold;
                ${shadowStyle}
              ">
                <div style="font-size: 8px; line-height: 1;">T</div>
                <div style="font-size: 5px; line-height: 1;">${criticalParams}/${totalParams}</div>
              </div>
              ${isSelected ? '<div style="position: absolute; top: -2px; left: -2px; width: 28px; height: 28px; border: 2px solid #8b5cf6; border-radius: 15%; animation: pulse 2s infinite;"></div>' : ''}
            </div>`;
        case 'user-added':
          const category = location.metadata?.category || '';
          const categoryInitial = category.charAt(0).toUpperCase() || 'U';
          return `
            <div style="position: relative;">
              <div style="
                background-color: ${color}; 
                width: 24px; height: 24px; 
                border: 2px solid ${borderColor}; 
                transform: rotate(45deg);
                display: flex; align-items: center; justify-content: center; 
                ${shadowStyle}
              ">
                <div style="transform: rotate(-45deg); font-size: 10px; color: white; font-weight: bold;">${categoryInitial}</div>
              </div>
              ${isSelected ? '<div style="position: absolute; top: -2px; left: -2px; width: 28px; height: 28px; border: 2px solid #8b5cf6; transform: rotate(45deg); animation: pulse 2s infinite;"></div>' : ''}
            </div>`;
        default:
          return `
            <div style="
              background-color: ${color}; 
              width: 24px; height: 24px; 
              border: 2px solid ${borderColor}; 
              border-radius: 50%; 
              display: flex; align-items: center; justify-content: center; 
              font-size: 10px; color: white; font-weight: bold;
              ${shadowStyle}
            ">?</div>`;
      }
    };

    return {
      html: getMarkerHtml(),
      className: 'custom-marker',
      iconSize: [28, 28] as [number, number],
      iconAnchor: [14, 14] as [number, number]
    };
  };

  const getClusterIcon = (cluster: MarkerCluster) => {
    const risk = cluster.averageRisk;
    const color = risk >= 70 ? '#ef4444' : risk >= 40 ? '#f59e0b' : '#22c55e';
    
    // Calculate the size based on the number of markers, with minimum and maximum sizes
    const baseSize = 60;
    const sizeMultiplier = Math.min(Math.max(cluster.markers.length / 3, 1), 3);
    const circleSize = baseSize * sizeMultiplier;
    
    return {
      html: `
        <div style="
          background: ${color}; 
          width: ${circleSize}px; 
          height: ${circleSize}px; 
          border: 3px solid white; 
          border-radius: 50%; 
          opacity: 0.3;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
        ">
          <div style="
            background: white; 
            color: ${color}; 
            border-radius: 50%; 
            width: 24px; 
            height: 24px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 10px; 
            font-weight: bold;
            opacity: 0.9;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          ">${cluster.markers.length}</div>
        </div>`,
      className: 'cluster-marker-transparent',
      iconSize: [circleSize + 6, circleSize + 6] as [number, number],
      iconAnchor: [(circleSize + 6) / 2, (circleSize + 6) / 2] as [number, number]
    };
  };

  const createMarkerPopup = (location: EnhancedLocationRisk) => {
    const riskLabel = location.riskPercentage >= 70 ? "High Risk" : 
                     location.riskPercentage >= 40 ? "Medium Risk" : "Low Risk";
    const riskColor = location.riskPercentage >= 70 ? '#ef4444' : 
                     location.riskPercentage >= 40 ? '#f59e0b' : '#22c55e';
    
    let typeIcon = '';
    let typeName = '';
    let typeDetails = '';
    
    switch (location.type) {
      case 'report':
        typeIcon = '[R]';
        typeName = 'Community Report';
        typeDetails = `
          <div style="font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span><strong>${location.metadata?.affectedCount || 0}</strong> affected</span>
              <span><strong>${location.metadata?.symptoms?.length || 0}</strong> symptoms</span>
            </div>
            ${location.metadata?.symptoms?.length ? `
              <div style="margin: 4px 0;">
                ${location.metadata.symptoms.slice(0, 3).map(symptom => 
                  `<span style="display: inline-block; background: #fee2e2; color: #dc2626; padding: 1px 4px; border-radius: 8px; font-size: 10px; margin: 1px;">${symptom}</span>`
                ).join('')}
                ${location.metadata.symptoms.length > 3 ? `<span style="font-size: 10px; color: #666;">+${location.metadata.symptoms.length - 3} more</span>` : ''}
              </div>` : ''}
            ${location.metadata?.notes ? `
              <div style="margin: 4px 0; font-size: 11px; color: #666; font-style: italic;">
                "${location.metadata.notes.length > 50 ? location.metadata.notes.substring(0, 50) + '...' : location.metadata.notes}"
              </div>` : ''}
          </div>
        `;
        break;
      case 'water-test':
        typeIcon = '[T]';
        typeName = 'Water Test';
        typeDetails = `
          <div style="font-size: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px;">
              <span><strong>${location.metadata?.kit || 'Unknown'}</strong><br><small>Test Kit</small></span>
              <span><strong>${location.metadata?.overallRisk || 'Unknown'}</strong><br><small>Overall Risk</small></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666;">
              <span>Confidence: <strong>${location.metadata?.confidence ? Math.round(location.metadata.confidence * 100) + '%' : 'N/A'}</strong></span>
              <span>Critical: <strong>${location.metadata?.criticalParameters || 0}/${location.metadata?.totalParameters || 0}</strong></span>
            </div>
            ${location.metadata?.testDate ? `
              <div style="margin-top: 4px; font-size: 10px; color: #888;">
                Test: ${new Date(location.metadata.testDate).toLocaleDateString()}
              </div>` : ''}
          </div>
        `;
        break;
      case 'user-added':
        typeIcon = '[U]';
        typeName = 'User Marker';
        typeDetails = `
          <div style="font-size: 12px;">
            <div style="margin-bottom: 4px;">
              <strong style="color: #8b5cf6;">${location.metadata?.title || 'User Marker'}</strong>
              ${location.metadata?.category ? `
                <span style="display: inline-block; background: #ede9fe; color: #8b5cf6; padding: 1px 6px; border-radius: 8px; font-size: 10px; margin-left: 4px;">${location.metadata.category}</span>
              ` : ''}
            </div>
            ${location.metadata?.description ? `
              <div style="font-size: 11px; color: #666; font-style: italic;">
                "${location.metadata.description.length > 60 ? location.metadata.description.substring(0, 60) + '...' : location.metadata.description}"
              </div>` : ''}
          </div>
        `;
        break;
    }

    return `
      <div style="min-width: 280px; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Compact Header -->
        <div style="background: linear-gradient(135deg, ${riskColor} 0%, ${riskColor}dd 100%); padding: 12px; border-radius: 6px 6px 0 0; color: white;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px; font-weight: bold;">${typeIcon}</span>
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 700; line-height: 1.2;">${location.location}</h3>
                <p style="margin: 0; font-size: 11px; opacity: 0.9;">${typeName}</p>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 18px; font-weight: bold;">${Math.round(location.riskPercentage)}%</div>
              <div style="font-size: 9px; opacity: 0.9;">${riskLabel}</div>
            </div>
          </div>
        </div>
        
        <!-- Compact Content -->
        <div style="background: white; padding: 10px; border-radius: 0 0 6px 6px; border: 1px solid #e5e7eb;">
          ${typeDetails}
          
          ${location.latitude && location.longitude ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f3f4f6; font-size: 10px; color: #9ca3af; text-align: center;">
              ${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)} • ${new Date(location.timestamp).toLocaleDateString()}
            </div>` : `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f3f4f6; font-size: 10px; color: #9ca3af; text-align: center;">
              ${new Date(location.timestamp).toLocaleDateString()}
            </div>`}
          
          ${onDeleteMarker ? `
            <div style="margin-top: 8px; text-align: center;">
              <button 
                onclick="window.deleteMarker('${location.id}')" 
                style="
                  background: #ef4444; 
                  color: white; 
                  border: none; 
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 11px; 
                  font-weight: 600;
                "
                onmouseover="this.style.background='#dc2626'"
                onmouseout="this.style.background='#ef4444'"
              >
                Delete
              </button>
            </div>` : ''}
        </div>
      </div>
    `;
  };

  const createClusterPopup = (cluster: MarkerCluster) => {
    const riskLabel = cluster.averageRisk >= 70 ? "High Risk" : 
                     cluster.averageRisk >= 40 ? "Medium Risk" : "Low Risk";
    const riskColor = cluster.averageRisk >= 70 ? '#ef4444' : 
                     cluster.averageRisk >= 40 ? '#f59e0b' : '#22c55e';
    
    const typeCounts = cluster.markers.reduce((acc, marker) => {
      acc[marker.type] = (acc[marker.type] || 0) + 1;
      return acc;
    }, {} as Record<MarkerType, number>);

    // Calculate risk distribution
    const riskLevels = {
      high: cluster.markers.filter(m => m.riskPercentage >= 70).length,
      medium: cluster.markers.filter(m => m.riskPercentage >= 40 && m.riskPercentage < 70).length,
      low: cluster.markers.filter(m => m.riskPercentage < 40).length
    };

    // Get recent markers (last 7 days)
    const recentMarkers = cluster.markers.filter(m => 
      Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length;

    return `
      <div style="min-width: 300px; max-width: 400px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: linear-gradient(135deg, ${riskColor}15 0%, ${riskColor}05 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 24px; margin-right: 8px;">[C]</span>
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #1f2937;">Hotspot Area</h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">${cluster.markers.length} markers in proximity</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">Average Risk</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="
                  background: ${riskColor}; 
                  color: white; 
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  font-size: 12px; 
                  font-weight: 600;
                ">${Math.round(cluster.averageRisk)}%</div>
                <span style="font-size: 12px; color: ${riskColor}; font-weight: 600;">${riskLabel}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: #6b7280;">Coverage Area</span>
              <div style="font-size: 12px; color: #9ca3af;">
                ~${(cluster.radius * 111).toFixed(1)} km radius
              </div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Marker Types</div>
            ${typeCounts.report ? `
              <div style="display: flex; align-items: center; gap: 6px; margin: 2px 0;">
                <span style="font-size: 14px;">📋</span>
                <span style="font-size: 12px;">Reports: <strong>${typeCounts.report}</strong></span>
              </div>` : ''}
            ${typeCounts['water-test'] ? `
              <div style="display: flex; align-items: center; gap: 6px; margin: 2px 0;">
                <span style="font-size: 14px;">🧪</span>
                <span style="font-size: 12px;">Tests: <strong>${typeCounts['water-test']}</strong></span>
              </div>` : ''}
            ${typeCounts['user-added'] ? `
              <div style="display: flex; align-items: center; gap: 6px; margin: 2px 0;">
                <span style="font-size: 14px;">📍</span>
                <span style="font-size: 12px;">User: <strong>${typeCounts['user-added']}</strong></span>
              </div>` : ''}
          </div>

          <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 4px solid ${riskColor};">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Risk Distribution</div>
            ${riskLevels.high ? `
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span style="font-size: 12px; color: #ef4444;">High Risk</span>
                <strong style="font-size: 12px; color: #ef4444;">${riskLevels.high}</strong>
              </div>` : ''}
            ${riskLevels.medium ? `
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span style="font-size: 12px; color: #f59e0b;">Medium Risk</span>
                <strong style="font-size: 12px; color: #f59e0b;">${riskLevels.medium}</strong>
              </div>` : ''}
            ${riskLevels.low ? `
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span style="font-size: 12px; color: #22c55e;">Low Risk</span>
                <strong style="font-size: 12px; color: #22c55e;">${riskLevels.low}</strong>
              </div>` : ''}
          </div>
        </div>

        <div style="background: #fef3c7; padding: 10px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">[T]</span>
            <div>
              <span style="font-size: 12px; font-weight: 600; color: #92400e;">
                ${recentMarkers} recent markers
              </span>
              <span style="font-size: 11px; color: #92400e; margin-left: 4px;">(last 7 days)</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding: 8px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
          <span style="font-size: 11px; color: #6b7280;">
            [i] Click individual markers for detailed information and actions
          </span>
        </div>
      </div>
    `;
  };

  // Handle marker deletion
  const handleDeleteMarker = async (markerId: string) => {
    if (onDeleteMarker) {
      try {
        await onDeleteMarker(markerId);
        setShowDeleteDialog(false);
        setSelectedMarker(null);
        onRefresh?.();
      } catch (error) {
        console.error('Failed to delete marker:', error);
      }
    }
  };

  // Update markers on map
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    const updateMarkers = async () => {
      try {
        const L = await import('leaflet');
        const map = mapInstanceRef.current;

        // Clear existing markers and clusters
        markersRef.current.forEach(marker => {
          if (map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        });
        clustersRef.current.forEach(cluster => {
          if (map.hasLayer(cluster)) {
            map.removeLayer(cluster);
          }
        });
        markersRef.current.clear();
        clustersRef.current.clear();

        const filteredLocations = getFilteredLocations();
        const clusters = showClusters ? createClusters(filteredLocations) : [];
        const clusteredMarkerIds = new Set(clusters.flatMap(c => c.markers.map(m => m.id)));

        // Add individual markers (not in clusters)
        filteredLocations.forEach((location) => {
          if (showClusters && clusteredMarkerIds.has(location.id)) return;

          const isSelected = selectedMarker?.id === location.id;
          const iconConfig = getMarkerIcon(location, isSelected);
          
          const icon = L.divIcon(iconConfig);
          const marker = L.marker([location.latitude!, location.longitude!], { icon })
            .addTo(map);

          marker.bindPopup(createMarkerPopup(location), {
            maxWidth: 320,
            className: 'enhanced-popup',
            autoPan: false // Prevent map from panning to show popup
          });
          
          // Add click handler for selection
          marker.on('click', (e) => {
            e.originalEvent?.stopPropagation(); // Prevent event bubbling
            setSelectedMarker(location);
            // Highlight the marker
            const newIconConfig = getMarkerIcon(location, true);
            const newIcon = L.divIcon(newIconConfig);
            marker.setIcon(newIcon);
          });

          markersRef.current.set(location.id, marker);
        });

        // Add cluster markers
        if (showClusters) {
          clusters.forEach((cluster) => {
            const iconConfig = getClusterIcon(cluster);
            const icon = L.divIcon(iconConfig);
            const marker = L.marker([cluster.centerLat, cluster.centerLng], { icon })
              .addTo(map);

            marker.bindPopup(createClusterPopup(cluster), {
              maxWidth: 400,
              className: 'enhanced-cluster-popup',
              autoPan: false // Prevent map from panning to show popup
            });

            clustersRef.current.set(cluster.id, marker);
          });
        }

        // Expose delete function to window for popup buttons
        (window as any).deleteMarker = (markerId: string) => {
          const marker = locationRisks.find(m => m.id === markerId);
          if (marker) {
            setSelectedMarker(marker);
            setShowDeleteDialog(true);
          }
        };

      } catch (error) {
        console.error('Failed to update markers:', error);
      }
    };

    updateMarkers();
  }, [isMapLoaded, locationRisks, showReports, showWaterTests, showUserAdded, showClusters, selectedMarker]);

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (!isMounted) return;

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([20.5937, 78.9629], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapLoaded(true);
        setMapError("");
      } catch (error: any) {
        console.error("Failed to load map:", error);
        setMapError("Failed to load map. Please refresh the page.");
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, []);

  const filteredLocations = getFilteredLocations();
  const invalidLocations = locationRisks.filter(
    (loc) => loc.latitude === undefined || loc.longitude === undefined,
  );

  const getTypeIcon = (type: MarkerType) => {
    switch (type) {
      case 'report': return <Users className="h-4 w-4" />;
      case 'water-test': return <FlaskConical className="h-4 w-4" />;
      case 'user-added': return <Plus className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: MarkerType) => {
    switch (type) {
      case 'report': return 'Community Reports';
      case 'water-test': return 'Water Tests';
      case 'user-added': return 'User Added';
    }
  };

  const getTypeCount = (type: MarkerType) => {
    return locationRisks.filter(loc => loc.type === type && loc.latitude && loc.longitude).length;
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      {showControls && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Map Filters
            </CardTitle>
            <CardDescription>
              Select which types of markers to display on the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-reports"
                  checked={showReports}
                  onCheckedChange={(checked) => setShowReports(checked === true)}
                />
                <label htmlFor="show-reports" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  {getTypeIcon('report')}
                  {getTypeName('report')}
                  <Badge variant="secondary">{getTypeCount('report')}</Badge>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-water-tests"
                  checked={showWaterTests}
                  onCheckedChange={(checked) => setShowWaterTests(checked === true)}
                />
                <label htmlFor="show-water-tests" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  {getTypeIcon('water-test')}
                  {getTypeName('water-test')}
                  <Badge variant="secondary">{getTypeCount('water-test')}</Badge>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-user-added"
                  checked={showUserAdded}
                  onCheckedChange={(checked) => setShowUserAdded(checked === true)}
                />
                <label htmlFor="show-user-added" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  {getTypeIcon('user-added')}
                  {getTypeName('user-added')}
                  <Badge variant="secondary">{getTypeCount('user-added')}</Badge>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-clusters"
                  checked={showClusters}
                  onCheckedChange={(checked) => setShowClusters(checked === true)}
                />
                <label htmlFor="show-clusters" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  🔥 Hotspots
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          {mapError ? (
            <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <p className="text-red-600 mb-2">{mapError}</p>
                <Button onClick={onRefresh} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={mapRef}
                className="h-[600px] w-full rounded-lg"
                style={{ minHeight: '600px' }}
              />
              {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-600">Loading map...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Marker Types</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">R</div>
                  <span>Community Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 flex items-center justify-center text-white text-xs font-bold" style={{borderRadius: '20%'}}>T</div>
                  <span>Water Test Results</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 flex items-center justify-center text-white text-xs font-bold transform rotate-45">
                    <div className="transform -rotate-45">U</div>
                  </div>
                  <span>User Added Markers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center opacity-30 relative">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-blue-500 text-xs font-bold">3</div>
                  </div>
                  <span>Hotspot Area (3+ markers)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Risk Levels</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Low Risk (0-39%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Medium Risk (40-69%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>High Risk (70-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span>Selected Marker</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invalid locations list */}
      {invalidLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Locations without coordinates</CardTitle>
            <CardDescription>
              These entries cannot be displayed on the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invalidLocations.map((location) => (
                <div key={location.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{location.location}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({getTypeName(location.type)})
                    </span>
                  </div>
                  <Badge variant={location.riskPercentage >= 70 ? "destructive" : location.riskPercentage >= 40 ? "default" : "secondary"}>
                    {location.riskPercentage}% Risk
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Marker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the marker for "{selectedMarker?.location}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMarker(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedMarker && handleDeleteMarker(selectedMarker.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}