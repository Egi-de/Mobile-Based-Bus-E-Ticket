import React from 'react';
import {
  ScrollView,
  RefreshControl,
  ScrollViewProps,
  ViewStyle,
} from 'react-native';
import { useLinearRefresh } from '../../hooks/useLinearRefresh';
import { LinearProgressBar } from './LinearProgressBar';
import { theme } from '../../config/theme';

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh?: () => Promise<void>;
  children?: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  onRefresh,
  children,
  contentContainerStyle,
  ...props
}) => {
  const { refreshing, onRefresh: handleRefresh, progressAnim } = useLinearRefresh(onRefresh || (async () => {}));

  return (
    <>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="transparent"
              colors={['transparent']}
              style={{ backgroundColor: 'transparent' }}
              progressBackgroundColor="transparent"
              progressViewOffset={-100}
            />
          ) : undefined
        }
        {...props}
      >
        {children}
      </ScrollView>

      <LinearProgressBar refreshing={refreshing} progressAnim={progressAnim} />
    </>
  );
};


