import Feather from '@expo/vector-icons/Feather';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { LEAFLET_CSS, LEAFLET_JS } from './leafletSource';
import { ScrollLockContext } from './ui';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string; // short text in pin (e.g. "A")
}

interface Props {
  center: { lat: number; lng: number };
  zoom?: number;
  /** Change this value to force the map to re-center. */
  centerKey?: string;
  markers?: MapMarker[];
  route?: [number, number][];
  routeColor?: string;
  onMapPress?: (lat: number, lng: number) => void;
  onMarkerPress?: (id: string) => void;
  showZoomControls?: boolean;
  /** Draws a blue "you are here" dot. */
  userLocation?: { lat: number; lng: number } | null;
  style?: StyleProp<ViewStyle>;
}

const HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${LEAFLET_CSS}</style>
<script>${LEAFLET_JS}</script>
<style>
 html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#EFEBFA}
 .pin{background:none;border:none}
 .me{width:18px;height:18px;border-radius:50%;background:#2F7BFF;border:3px solid #fff;box-sizing:border-box;box-shadow:0 0 0 0 rgba(47,123,255,.5);animation:pulse 2s infinite}
 @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(47,123,255,.5)}70%{box-shadow:0 0 0 16px rgba(47,123,255,0)}100%{box-shadow:0 0 0 0 rgba(47,123,255,0)}}
 @media (prefers-reduced-motion: reduce){.me{animation:none}}
 .leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.7)!important}
</style></head><body><div id="map"></div>
<script>
 var post=function(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))};
 if(typeof L==='undefined'){post({type:'offline'});}
 var map=L.map('map',{zoomControl:false,attributionControl:true});
 // Map tiles need no API key. CARTO first; if it keeps failing, fall back to OpenStreetMap's own servers.
 var SOURCES=[
   {url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',o:{maxZoom:19,subdomains:'abcd',attribution:'&copy; OpenStreetMap &copy; CARTO'}},
   {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',o:{maxZoom:19,attribution:'&copy; OpenStreetMap'}}
 ];
 var src=0, tiles=null, errs=0, loads=0, tilesOk=true;
 function useSource(i){
   if(tiles){map.removeLayer(tiles);}
   src=i; errs=0; loads=0;
   tiles=L.tileLayer(SOURCES[i].url,SOURCES[i].o).addTo(map);
   tiles.on('tileerror',function(){
     errs++;
     if(loads===0&&errs>=4&&src<SOURCES.length-1){useSource(src+1);return;}
     if(loads===0&&errs>=4&&tilesOk){tilesOk=false;post({type:'tiles',ok:false});}
   });
   tiles.on('tileload',function(){loads++;if(!tilesOk){tilesOk=true;post({type:'tiles',ok:true});}});
 }
 useSource(0);
 window.__retry=function(){tilesOk=true;useSource(0);};
 var layer=L.layerGroup().addTo(map); var routeLayer=null; var lastKey=null; var meMarker=null;
 function pin(color,label){
   var size=label?34:24;
   var inner=label?'<span style="font:900 14px/1 sans-serif;color:#fff">'+label+'</span>':'';
   return L.divIcon({className:'pin',iconSize:[size,size],iconAnchor:[size/2,size/2],
     html:'<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+color+';border:4px solid #fff;box-sizing:border-box;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(58,29,153,.35)">'+inner+'</div>'});
 }
 window.__zoom=function(d){if(d>0)map.zoomIn();else map.zoomOut();};
 window.__update=function(d){
   if(d.centerKey!==lastKey){lastKey=d.centerKey;map.setView([d.center.lat,d.center.lng],d.zoom||14);}
   layer.clearLayers();
   (d.markers||[]).forEach(function(m){
     L.marker([m.lat,m.lng],{icon:pin(m.color,m.label)}).on('click',function(){post({type:'marker',id:m.id})}).addTo(layer);
   });
   if(meMarker){map.removeLayer(meMarker);meMarker=null;}
   if(d.me){meMarker=L.marker([d.me.lat,d.me.lng],{icon:L.divIcon({className:'pin',html:'<div class="me"></div>',iconSize:[18,18],iconAnchor:[9,9]}),interactive:false,zIndexOffset:1000}).addTo(map);}
   if(routeLayer){map.removeLayer(routeLayer);routeLayer=null;}
   if(d.route&&d.route.length>1){routeLayer=L.polyline(d.route,{color:d.routeColor||'#6C3BFF',weight:7,opacity:.9,lineCap:'round'}).addTo(map);}
 };
 map.on('click',function(e){post({type:'press',lat:e.latlng.lat,lng:e.latlng.lng})});
 map.setView([13.6235,123.1985],14);
 post({type:'ready'});
</script></body></html>`;

export default function LeafletMap({
  center,
  zoom = 14,
  centerKey,
  markers = [],
  route,
  routeColor,
  onMapPress,
  onMarkerPress,
  showZoomControls = false,
  userLocation,
  style,
}: Props) {
  const ref = useRef<WebView<{}>>(null);
  const setPageScroll = useContext(ScrollLockContext);
  const ready = useRef(false);
  /** Map can't load (no internet, or tiles blocked). Reports still work without it. */
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const key = centerKey ?? `${center.lat},${center.lng},${zoom}`;
  const payload = useMemo(
    () => JSON.stringify({ center, zoom, centerKey: key, markers, route, routeColor, me: userLocation ?? null }),
    [center, zoom, key, markers, route, routeColor, userLocation],
  );

  const push = () => ref.current?.injectJavaScript(`window.__update(${payload});true;`);

  useEffect(() => {
    if (ready.current) push();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  // If the map page never reports ready (e.g. Leaflet couldn't download), treat it as offline.
  useEffect(() => {
    ready.current = false;
    const t = setTimeout(() => {
      if (!ready.current) setOffline(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [reloadKey]);

  const retry = () => {
    setOffline(false);
    setReloadKey((k) => k + 1);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') {
        ready.current = true;
        push();
      } else if (msg.type === 'offline') setOffline(true);
      else if (msg.type === 'tiles') setOffline(!msg.ok);
      else if (msg.type === 'press') onMapPress?.(msg.lat, msg.lng);
      else if (msg.type === 'marker') onMarkerPress?.(msg.id);
    } catch {}
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={{ color: colors.muted }}>The map is available in the Android / iOS app.</Text>
      </View>
    );
  }

  const zoomBy = (delta: number) => ref.current?.injectJavaScript(`window.__zoom&&window.__zoom(${delta});true;`);

  return (
    <View
      style={[styles.wrap, style]}
      onTouchStart={() => setPageScroll?.(false)}
      onTouchEnd={() => setPageScroll?.(true)}
      onTouchCancel={() => setPageScroll?.(true)}
    >
      <WebView<{}>
        key={reloadKey}
        ref={ref}
        onError={() => setOffline(true)}
        originWhitelist={['*']}
        // A real https base URL gives tile requests a Referer header, which OpenStreetMap's tile policy requires.
        source={{ html: HTML, baseUrl: 'https://github.com/venstqs/BayaniHan' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        style={styles.web}
      />
      {offline ? (
        <View style={styles.offline} pointerEvents="box-none">
          <View style={styles.offlineCard}>
            <Feather name="wifi-off" size={18} color={colors.primaryDeep} />
            <Text style={styles.offlineText}>The map needs internet to load. Reports you send are still saved.</Text>
            <Pressable onPress={retry} hitSlop={8} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {showZoomControls ? (
        <View style={styles.zoomBox}>
          <Pressable onPress={() => zoomBy(1)} style={styles.zoomBtn} accessibilityLabel="Zoom in">
            <Feather name="plus" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.zoomDiv} />
          <Pressable onPress={() => zoomBy(-1)} style={styles.zoomBtn} accessibilityLabel="Zoom out">
            <Feather name="minus" size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.sunken },
  web: { flex: 1, backgroundColor: colors.sunken },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sunken },
  zoomBox: {
    position: 'absolute',
    right: 14,
    top: '44%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  zoomBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  offline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 16 },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    ...shadow,
  },
  offlineText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.text },
  retry: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  retryText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  zoomDiv: { height: 1, backgroundColor: colors.border },
});
