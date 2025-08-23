import React from "react";
import { View, StyleSheet } from "react-native";
import globalErrorHandler from "../services/globalErrorHandler";
import ErrorFallback from "./ErrorFallback";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // State'i güncelle ki bir sonraki render'da fallback UI gösterilsin
    return {
      hasError: true,
      error: error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Error details'i state'e kaydet
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Global error handler'a bildir
    globalErrorHandler.reportError(error, {
      boundaryName: this.props.name || "Unknown",
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      props: this.props.logProps ? this.props : "Props logging disabled",
    });

    // Development modunda console'a detaylı log
    if (__DEV__) {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Boundary Name:", this.props.name || "Unknown");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    // Opsiyonel: Parent'a hata bildirimi
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Retry callback varsa çağır
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Reset callback varsa çağır
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback varsa onu kullan
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReset={this.handleReset}
            boundaryName={this.props.name}
          />
        );
      }

      // Micro boundary ise minimal fallback
      if (this.props.micro) {
        return (
          <View style={styles.microError}>
            {/* Micro fallback - sadece boş alan veya minimal indicator */}
          </View>
        );
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          boundaryName={this.props.name}
          level={this.props.level || "component"}
        />
      );
    }

    // Hata yoksa normal render
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  microError: {
    height: 1,
    backgroundColor: "transparent",
  },
});

export default ErrorBoundary;
