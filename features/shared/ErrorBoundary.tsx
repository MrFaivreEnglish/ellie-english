import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../settings/ThemeContext';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onBack?: () => void;
  onHome?: () => void;
  title?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundaryBase extends React.Component<ErrorBoundaryProps & ReturnType<typeof useBoundaryTheme>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('Screen error boundary caught an error', error, info.componentStack);
  }

  resetAndBack = () => {
    this.setState({ hasError: false });
    this.props.onBack?.();
  };

  resetAndHome = () => {
    this.setState({ hasError: false });
    this.props.onHome?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { colors, title = 'Something went wrong' } = this.props;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.dangerSoft }]}>
            <MaterialIcons name="error-outline" size={30} color={colors.danger} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.secondaryText }]}>
            This lesson could not be opened safely.
          </Text>
          <View style={styles.actions}>
            {this.props.onBack && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={this.resetAndBack}
                style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go back</Text>
              </TouchableOpacity>
            )}
            {this.props.onHome && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={this.resetAndHome}
                style={[styles.primaryButton, { backgroundColor: colors.buttonBackground, borderColor: colors.buttonBackground }]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }
}

const useBoundaryTheme = () => {
  const { colors } = useTheme();
  return { colors };
};

export default function ErrorBoundary(props: ErrorBoundaryProps) {
  const theme = useBoundaryTheme();
  return <ErrorBoundaryBase {...props} {...theme} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    maxWidth: 420,
    padding: 24,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    marginBottom: 16,
    width: 54,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 42,
    minWidth: 108,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 42,
    minWidth: 108,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
