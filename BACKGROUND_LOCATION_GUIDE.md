# Background Location Tracking - Implementation Guide

## Overview
Background location tracking has been fully implemented in PanditYatra to enable:
- Nearby pandit discovery while app is in background
- Real-time delivery coordination for active bookings
- Better service logistics

## Features

### ✅ What's Implemented

1. **Background Task Handler** (`location.store.ts`)
   - Tracks location updates every 5 minutes or when user moves 500+ meters
   - Auto-updates country detection and currency
   - Logs updates with timestamps
   - Low battery impact with `Location.Accuracy.Balanced`

2. **Permission Management** (`useAppPermissions.ts`)
   - New `backgroundLocation` permission type
   - Proper permission flow: foreground → background
   - Platform-specific handling (Android/iOS)
   - User-friendly permission dialogs

3. **UI Component** (`BackgroundLocationToggle.tsx`)
   - Toggle switch to enable/disable tracking
   - Real-time status display
   - Last update timestamp
   - Permission request flow with explanations

4. **Store Methods** (`location.store.ts`)
   - `startBackgroundTracking()` - Starts tracking
   - `stopBackgroundTracking()` - Stops tracking
   - `isBackgroundTrackingEnabled` - Current state
   - `lastBackgroundUpdate` - Last update timestamp

## Usage

### 1. Import the Toggle Component

```tsx
import { BackgroundLocationToggle } from '@/components/location/BackgroundLocationToggle';
```

### 2. Add to Your Settings/Profile Screen

```tsx
export default function SettingsScreen() {
  return (
    <ScrollView>
      {/* Other settings */}
      
      <BackgroundLocationToggle 
        onToggle={(enabled) => {
          console.log('Background tracking:', enabled);
        }}
      />
      
      {/* More settings */}
    </ScrollView>
  );
}
```

### 3. Programmatic Control (Advanced)

```tsx
import { useLocationStore } from '@/store/location.store';
import { useAppPermissions } from '@/hooks/useAppPermissions';

function MyComponent() {
  const { 
    startBackgroundTracking, 
    stopBackgroundTracking,
    isBackgroundTrackingEnabled,
    lastBackgroundUpdate 
  } = useLocationStore();

  const { requestPermission } = useAppPermissions();

  const enableTracking = async () => {
    // Request permission first
    const status = await requestPermission('backgroundLocation');
    
    if (status === 'granted') {
      const success = await startBackgroundTracking();
      console.log('Tracking started:', success);
    }
  };

  const disableTracking = async () => {
    await stopBackgroundTracking();
    console.log('Tracking stopped');
  };

  return (
    <View>
      <Text>Status: {isBackgroundTrackingEnabled ? 'Active' : 'Inactive'}</Text>
      <Text>Last Update: {lastBackgroundUpdate || 'Never'}</Text>
      <Button title="Start" onPress={enableTracking} />
      <Button title="Stop" onPress={disableTracking} />
    </View>
  );
}
```

## Configuration

### Android Foreground Service Notification

When background tracking is active, users see a persistent notification:

```typescript
// In location.store.ts - line 203-208
foregroundService: {
  notificationTitle: 'PanditYatra Location',
  notificationBody: 'Tracking location for nearby pandit discovery and delivery coordination',
  notificationColor: '#f97316', // Orange theme color
}
```

**Customize this** to match your branding needs.

### Update Intervals

```typescript
// In location.store.ts - line 204-206
accuracy: Location.Accuracy.Balanced,    // Battery-friendly
timeInterval: 300000,                    // 5 minutes (adjust as needed)
distanceInterval: 500,                   // 500 meters (adjust as needed)
```

**Adjust these values** based on your requirements:
- **Higher accuracy** = More battery drain
- **Lower intervals** = More frequent updates, more battery drain
- **Balanced settings** = Good trade-off between accuracy and battery

## Permissions

### Android (app.json)
```json
"permissions": [
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_BACKGROUND_LOCATION"  // ✅ Required
]
```

```json
"expo-location": {
  "isAndroidBackgroundLocationEnabled": true  // ✅ Required
}
```

### iOS (app.json)
```json
"NSLocationWhenInUseUsageDescription": "...",
"NSLocationAlwaysAndWhenInUseUsageDescription": "..."  // ✅ Required for background
```

## Testing

### 1. Enable Background Tracking
```bash
# Run your app
npm start

# In the app, go to Settings and toggle Background Location ON
```

### 2. Check Logs
```bash
# Watch for these logs:
[BackgroundLocation] Started successfully
[BackgroundLocation] Updated: Nepal
```

### 3. Test Background Updates
- Enable tracking in app
- Put app in background
- Move 500+ meters or wait 5 minutes
- Check logs for background updates

### 4. Test Permission Flow
- Disable location permissions in device Settings
- Try to enable background tracking
- Should see proper permission dialogs

## Important Notes

### 🔋 Battery Impact
- Uses `Location.Accuracy.Balanced` for efficiency
- Updates every 5 minutes OR 500 meters (whichever comes first)
- Minimal battery drain with these settings

### 📱 Platform Differences

**Android:**
- Shows persistent notification when tracking
- Notification cannot be dismissed while tracking is active
- Users can stop tracking by toggling OFF in app

**iOS:**
- Shows blue status bar when tracking
- Users must grant "Always Allow" permission
- More strict background location policies

### 🔒 Privacy & Google Play Store

**IMPORTANT:** Background location permission triggers additional review on Google Play Store.

You must:
1. Clearly explain WHY you need background location
2. Provide a way for users to disable it
3. Only track when necessary (e.g., active bookings)

**Already implemented:**
- ✅ Toggle component with clear explanations
- ✅ Easy enable/disable functionality
- ✅ Transparent permission rationale

## Troubleshooting

### "Permission denied" on Android
- Ensure `ACCESS_BACKGROUND_LOCATION` is in `app.json`
- Check that `isAndroidBackgroundLocationEnabled: true`
- Rebuild the app: `npm run android`

### "Permission denied" on iOS
- Ensure `NSLocationAlwaysAndWhenInUseUsageDescription` is in `app.json`
- User must select "Allow While Using App" first, then "Change to Always Allow"
- Rebuild: `npm run ios`

### Background updates not working
1. Check logs for errors
2. Verify location services are enabled on device
3. Ensure app has background permission granted
4. Try stopping and restarting tracking

### High battery drain
- Increase `timeInterval` (e.g., 600000 for 10 minutes)
- Increase `distanceInterval` (e.g., 1000 for 1km)
- Use `Location.Accuracy.Low` instead of `Balanced`

## Example Screens

### Settings Screen Example
```tsx
// src/app/(customer)/settings.tsx or src/app/(pandit)/settings.tsx

import { BackgroundLocationToggle } from '@/components/location/BackgroundLocationToggle';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Location Services</Text>
      
      <BackgroundLocationToggle 
        onToggle={(enabled) => {
          if (enabled) {
            // Track analytics event
            logEvent('background_location_enabled');
          }
        }}
      />
      
      {/* Other settings */}
    </ScrollView>
  );
}
```

### Profile Screen Example
```tsx
// Show background tracking status in profile

import { useLocationStore } from '@/store/location.store';

export default function ProfileScreen() {
  const { isBackgroundTrackingEnabled } = useLocationStore();
  
  return (
    <View>
      {/* Profile info */}
      
      <View style={styles.statusCard}>
        <Text>Background Location: {isBackgroundTrackingEnabled ? '✅ Active' : '❌ Inactive'}</Text>
      </View>
      
      {/* Rest of profile */}
    </View>
  );
}
```

## Next Steps

1. **Add the toggle to your Settings screen:**
   ```tsx
   import { BackgroundLocationToggle } from '@/components/location/BackgroundLocationToggle';
   ```

2. **Test the implementation:**
   - Enable tracking
   - Put app in background
   - Move around and check logs

3. **Customize as needed:**
   - Adjust update intervals
   - Change notification text
   - Modify permission explanations

4. **Prepare for Google Play submission:**
   - Add clear privacy policy
   - Document background location usage
   - Provide screenshots showing the toggle

## Support

If you encounter issues:
1. Check the logs for `[BackgroundLocation]` messages
2. Verify permissions in device Settings
3. Rebuild the app if you modified `app.json`
4. Check this guide's Troubleshooting section

---

**Implementation Status:** ✅ Complete and Ready to Use
**Last Updated:** 2026-06-26
