import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPanditSummary } from '@/services/pandit.service';
import { Pandit } from '@/types/pandit';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PanditProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const handleChatPress = async () => {
    try {
      if (!pandit) return;
      setChatLoading(true);
      const { initiateChat } = await import('@/services/chat.service');
      const room = await initiateChat(Number(id));
      if (room && room.id) {
        router.push(`/chat/${room.id}`);
      }
    } catch (e) {
      console.error('Failed to initiate chat:', e);
      alert('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (typeof id === 'string') {
          const [panditRes, reviewsData] = await Promise.all([
            getPanditSummary(Number(id)),
            import('@/services/review.service').then(m => m.fetchPanditReviews(Number(id)))
          ]);
          
          const data = panditRes.data;
          
          if (data) {
            const mappedPandit: Pandit = {
              id: String(data.id),
              name: data.user_details?.full_name || 'Unknown',
              image: getImageUrl(data.user_details?.profile_pic) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
              location: 'Kathmandu, Nepal',
              rating: data.rating || 5.0,
              reviewCount: data.review_count || 0,
              experience: data.experience_years || 0,
              isAvailable: data.is_available ?? true,
              bio: data.bio || '',
              specialization: data.expertise ? data.expertise.split(',').map((s: string) => s.trim()) : [],
              languages: data.language ? data.language.split(',').map((s: string) => s.trim()) : [],
              services: (data.services || []).map((s: any) => ({
                id: s.id,
                name: s.puja_details?.name || 'Service',
                duration: s.duration_minutes,
                price: parseFloat(s.custom_price) || s.puja_details?.base_price || 0,
                image: s.puja_details?.image,
                description: s.puja_details?.description
              })),
              price: data.services && data.services.length > 0 ? Math.min(...data.services.map((s: any) => parseFloat(s.custom_price))) : 500,
              isVerified: data.is_verified
            };
            setPandit(mappedPandit);
            // Reviews mapping
            const rawReviews: any = reviewsData;
            const safeReviews = Array.isArray(rawReviews) 
                ? rawReviews 
                : (rawReviews?.reviews || rawReviews?.data || rawReviews?.results || []);
                
            const mappedReviews = Array.isArray(safeReviews) ? safeReviews.map((r: any) => ({
                ...r,
                customer_avatar: r.customer_avatar,
                customer_name: r.customer_name
            })) : [];
            setReviews(mappedReviews);
          }
        }
      } catch (e) {
        console.error('Failed to load pandit data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!pandit) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text + '30'} />
        <Text style={{ color: colors.text + '80', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Pandit not found</Text>
        <TouchableOpacity 
            style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 16 }}
            onPress={() => router.back()}
        >
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 140 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Responsive Hero Header */}
        <View className="w-full h-[440px] relative">
          <Image 
            source={{ uri: pandit.image || undefined }} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="cover" 
          />
          <View className="absolute inset-0 bg-black/40" />
          
          {/* Top Actions with Safe Area */}
          <View 
            className="absolute left-6 right-6 flex-row justify-between items-center z-50"
            style={{ top: Math.max(insets.top, 20) }}
          >
            <TouchableOpacity 
                className="w-11 h-11 bg-black/20 rounded-full items-center justify-center border border-white/20"
                onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity className="w-11 h-11 bg-black/20 rounded-full items-center justify-center border border-white/20">
              <Ionicons name="share-social-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Hero Name & Badge */}
          <View className="absolute bottom-12 left-8 z-50">
            <View className="flex-row items-center gap-3 mb-2">
                <Text className="text-white text-3xl font-black">{pandit.name}</Text>
                {pandit.isVerified && (
                   <View className="bg-white rounded-full p-1 shadow-sm">
                      <Ionicons name="checkmark-circle" size={18} color="#FF6F00" />
                   </View>
                )}
            </View>
            <View className="flex-row items-center gap-1.5 opacity-90">
                <Ionicons name="location" size={14} color="#FFF" />
                <Text className="text-white font-extrabold text-sm uppercase tracking-widest">{pandit.location}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid - High-Fidelity Floating Card */}
        <View className="-mt-8 px-6 z-50">
            <View className="bg-white rounded-[32px] p-6 flex-row items-center justify-between shadow-xl shadow-zinc-200 border border-zinc-50">
                <StatItem label="Rating" val={pandit.rating.toString()} icon="star" iconColor="#FFD700" />
                <View className="w-[1px] h-10 bg-zinc-100" />
                <StatItem label="Exp" val={`${pandit.experience}+ Yrs`} icon="ribbon" iconColor="#3B82F6" />
                <View className="w-[1px] h-10 bg-zinc-100" />
                <StatItem label="Reviews" val={pandit.reviewCount.toString()} icon="chatbubbles" iconColor="#A855F7" />
                <View className="w-[1px] h-10 bg-zinc-100" />
                <View className="items-center flex-1">
                    <Ionicons 
                        name={(pandit.isAvailable ?? true) ? "checkmark-circle" : "time"} 
                        size={20} 
                        color={(pandit.isAvailable ?? true) ? "#10B981" : "#EF4444"} 
                    />
                    <Text className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${(pandit.isAvailable ?? true) ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(pandit.isAvailable ?? true) ? "Available" : "Busy"}
                    </Text>
                </View>
            </View>
        </View>

        <View className="px-6 mt-10">
          {/* About Section */}
          <View className="mb-10">
            <Text className="text-xl font-black text-zinc-900 mb-4">About Pandit Ji</Text>
            <Text className="text-zinc-500 text-[15px] leading-6 font-medium">
              {pandit.bio || `${pandit.name} is a renowned Vedic scholar with over ${pandit.experience} years of experience in performing sacred rituals and spiritual guidance.`}
            </Text>
            
            {/* Specialization Tags */}
            <View className="flex-row flex-wrap gap-2.5 mt-6">
                {pandit.specialization.map((spec, i) => (
                    <View key={i} className="bg-orange-50/50 px-4 py-2 rounded-xl border border-orange-100">
                        <Text className="text-primary font-bold text-xs">{spec}</Text>
                    </View>
                ))}
            </View>
          </View>

          {/* Puja Services - Standardized Grid/List */}
          <View className="mb-10">
            <View className="flex-row justify-between items-end mb-6">
              <Text className="text-xl font-black text-zinc-900">Puja Services</Text>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-sm">View All</Text>
              </TouchableOpacity>
            </View>
            
            <View className="gap-5">
              {(pandit.services || []).map((service, idx) => (
                <ServiceCard 
                    key={idx} 
                    service={service} 
                    onBook={() => router.push(`/(customer)/booking?panditId=${pandit.id}&serviceId=${service.id}`)} 
                />
              ))}
            </View>
          </View>

          {/* Recent Reviews */}
          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-6">
              <Text className="text-xl font-black text-zinc-900">Patient Stories</Text>
              {reviews.length > 0 && <TouchableOpacity><Text className="text-primary font-bold text-sm">See All</Text></TouchableOpacity>}
            </View>
            
            <View className="gap-4">
                {reviews.length > 0 ? (
                    reviews.slice(0, 3).map((review, idx) => (
                        <ReviewCard key={idx} review={review} />
                    ))
                ) : (
                    <View className="bg-white p-10 rounded-[32px] items-center border border-zinc-100 dashed">
                        <Ionicons name="chatbox-ellipses-outline" size={40} color="#E5E7EB" />
                        <Text className="text-zinc-400 mt-4 font-medium text-center">No reviews yet. Be the first one to share your experience!</Text>
                    </View>
                )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* High-Fidelity Bottom Bar with Safe Area */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white shadow-2xl elevation-20 px-6 flex-row items-center justify-between border-t border-zinc-50"
        style={{ 
            height: 90 + insets.bottom, 
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 16
        }}
      >
        <TouchableOpacity 
          className="w-16 h-14 rounded-2xl border-1.5 border-primary items-center justify-center bg-orange-50/30"
          onPress={handleChatPress}
          disabled={chatLoading}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color="#FF6F00" />
          ) : (
            <>
              <Ionicons name="chatbubbles-outline" size={24} color="#FF6F00" />
              <Text className="text-[10px] font-black text-primary uppercase tracking-tighter mt-1">Chat</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 ml-4 h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${(pandit.isAvailable ?? true) ? 'bg-primary shadow-primary/30' : 'bg-zinc-300'}`}
          onPress={() => router.push(`/(customer)/booking?panditId=${pandit.id}`)}
          disabled={!(pandit.isAvailable ?? true)}
        >
          <Text className="text-white font-black text-lg uppercase tracking-widest">
            {(pandit.isAvailable ?? true) ? "BOOK NOW" : "BUSY NOW"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({ label, val, icon, iconColor }: { label: string, val: string, icon: any, iconColor: string }) {
    return (
        <View className="items-center flex-1">
            <View className="flex-row items-center gap-1 mb-1">
                <Ionicons name={icon} size={14} color={iconColor} />
                <Text className="text-zinc-800 font-black text-base">{val}</Text>
            </View>
            <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</Text>
        </View>
    );
}

function ServiceCard({ service, onBook }: { service: any, onBook: () => void }) {
    return (
        <View className="bg-white p-5 rounded-[32px] shadow-sm shadow-zinc-100 border border-zinc-50">
            <View className="flex-row mb-4">
                <Image 
                    source={{ uri: getImageUrl(service.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=400' }} 
                    style={{ width: 80, height: 80, borderRadius: 16 }}
                    contentFit="cover"
                />
                <View className="flex-1 ml-4 justify-center">
                    <Text className="text-zinc-800 font-extrabold text-lg mb-1">{service.name}</Text>
                    <View className="flex-row items-center gap-1.5 mb-2">
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                        <Text className="text-zinc-400 font-bold text-xs uppercase">{service.duration} Mins</Text>
                    </View>
                    <Text className="text-primary font-black text-base">NPR {service.price}</Text>
                </View>
            </View>
            {service.description && (
                <Text className="text-zinc-500 italic text-xs mb-5 leading-5 font-medium" numberOfLines={2}>
                    &quot;{service.description}&quot;
                </Text>
            )}
            <TouchableOpacity 
                className="bg-primary py-3.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-primary/20"
                onPress={onBook}
            >
                <Text className="text-white font-black text-sm uppercase tracking-widest">Select Service</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

function ReviewCard({ review }: { review: any }) {
    return (
        <View className="bg-white p-5 rounded-[32px] shadow-sm shadow-zinc-100 border border-zinc-50">
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center border border-orange-100 overflow-hidden">
                        {review.customer_avatar ? (
                            <Image source={{ uri: getImageUrl(review.customer_avatar) || undefined }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                            <Text className="text-primary font-black">{review.customer_name?.[0]?.toUpperCase() || 'U'}</Text>
                        )}
                    </View>
                    <View className="ml-3">
                        <Text className="text-zinc-800 font-extrabold text-sm">{review.customer_name || 'Anonymous'}</Text>
                        <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{dayjs(review.created_at).fromNow()}</Text>
                    </View>
                </View>
                <View className="bg-amber-50 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                    <Ionicons name="star" size={10} color="#FFB000" />
                    <Text className="text-amber-600 font-black text-[10px]">{review.rating.toFixed(1)}</Text>
                </View>
            </View>
            <Text className="text-zinc-500 italic text-[13px] leading-6 font-medium">&quot;{review.comment}&quot;</Text>
        </View>
    );
}
