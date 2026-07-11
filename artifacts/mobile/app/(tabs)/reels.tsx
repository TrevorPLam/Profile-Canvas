import React from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ReelCard } from '@/components/ReelCard';
import { useReels } from '@/hooks/useReels';

const { height: screenHeight } = Dimensions.get('window');

export default function ReelsScreen() {
  const { reels, isLoading, error } = useReels();
  const insets = useSafeAreaInsets();
  const cardHeight = screenHeight;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="film"
          title="Loading reels..."
          subtitle="Fetching short vertical videos."
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="film"
          title="Error loading reels"
          subtitle="Please check your connection and try again."
        />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="film"
          title="No reels yet"
          subtitle="Short vertical videos will appear here."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={cardHeight}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: cardHeight, offset: cardHeight * index, index })}
        renderItem={({ item }) => <ReelCard post={item} author={item.author} height={cardHeight} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
