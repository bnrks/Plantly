import React, { useContext, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import { ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";

/**
 * TipTap JSON içeriğini React Native componentlerine render eder.
 * Firestore'dan gelen modül içeriklerini göstermek için kullanılır.
 */
export default function TipTapRenderer({ content, style }) {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  const styles = useMemo(
    () => createStyles(theme, selectedTheme),
    [theme, selectedTheme]
  );

  // Content null veya undefined ise boş döndür
  if (!content) {
    return null;
  }

  // Content string ise (eski format uyumluluğu) direkt text olarak göster
  if (typeof content === "string") {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.paragraph}>{content}</Text>
      </View>
    );
  }

  // TipTap JSON formatı
  if (content.type === "doc" && Array.isArray(content.content)) {
    return (
      <View style={[styles.container, style]}>
        {content.content.map((node, index) => (
          <RenderNode
            key={`node-${index}`}
            node={node}
            styles={styles}
            theme={theme}
          />
        ))}
      </View>
    );
  }

  // Tanınmayan format
  return null;
}

/**
 * Tek bir node'u render eder (recursive)
 */
function RenderNode({ node, styles, theme, listIndex }) {
  if (!node) return null;

  switch (node.type) {
    case "doc":
      return (
        <>
          {node.content?.map((child, i) => (
            <RenderNode
              key={`doc-${i}`}
              node={child}
              styles={styles}
              theme={theme}
            />
          ))}
        </>
      );

    case "paragraph":
      return (
        <Text style={styles.paragraph}>
          <RenderInlineContent content={node.content} styles={styles} theme={theme} />
        </Text>
      );

    case "heading":
      const level = node.attrs?.level || 1;
      const headingStyle = styles[`heading${level}`] || styles.heading1;
      return (
        <Text style={headingStyle}>
          <RenderInlineContent content={node.content} styles={styles} theme={theme} />
        </Text>
      );

    case "bulletList":
      return (
        <View style={styles.bulletList}>
          {node.content?.map((item, i) => (
            <RenderNode
              key={`bullet-${i}`}
              node={item}
              styles={styles}
              theme={theme}
              listIndex={i}
            />
          ))}
        </View>
      );

    case "orderedList":
      return (
        <View style={styles.orderedList}>
          {node.content?.map((item, i) => (
            <RenderNode
              key={`ordered-${i}`}
              node={item}
              styles={styles}
              theme={theme}
              listIndex={i + 1}
            />
          ))}
        </View>
      );

    case "listItem":
      const bulletChar = listIndex !== undefined && typeof listIndex === "number" && listIndex > 0
        ? `${listIndex}.`
        : "•";
      return (
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>{bulletChar}</Text>
          <View style={styles.listItemContent}>
            {node.content?.map((child, i) => (
              <RenderNode
                key={`li-${i}`}
                node={child}
                styles={styles}
                theme={theme}
              />
            ))}
          </View>
        </View>
      );

    case "blockquote":
      return (
        <View style={styles.blockquote}>
          {node.content?.map((child, i) => (
            <RenderNode
              key={`bq-${i}`}
              node={child}
              styles={styles}
              theme={theme}
            />
          ))}
        </View>
      );

    case "image":
      if (!node.attrs?.src) return null;
      return (
        <Image
          source={{ uri: node.attrs.src }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={node.attrs.alt || "Modül görseli"}
        />
      );

    case "hardBreak":
      return <Text>{"\n"}</Text>;

    default:
      // Bilinmeyen node tipi, children varsa render et
      if (node.content) {
        return (
          <>
            {node.content.map((child, i) => (
              <RenderNode
                key={`unknown-${i}`}
                node={child}
                styles={styles}
                theme={theme}
              />
            ))}
          </>
        );
      }
      return null;
  }
}

/**
 * Inline içerik render eder (text, marks ile)
 */
function RenderInlineContent({ content, styles, theme }) {
  if (!content || !Array.isArray(content)) {
    return null;
  }

  return (
    <>
      {content.map((node, i) => (
        <RenderTextNode
          key={`inline-${i}`}
          node={node}
          styles={styles}
          theme={theme}
        />
      ))}
    </>
  );
}

/**
 * Text node'unu marks ile birlikte render eder
 */
function RenderTextNode({ node, styles, theme }) {
  if (!node) return null;

  if (node.type === "hardBreak") {
    return <Text>{"\n"}</Text>;
  }

  if (node.type !== "text" || !node.text) {
    return null;
  }

  const marks = node.marks || [];
  let textStyle = [styles.text];

  // Marks'ları uygula
  const isBold = marks.some((m) => m.type === "bold");
  const isItalic = marks.some((m) => m.type === "italic");
  const linkMark = marks.find((m) => m.type === "link");

  if (isBold) {
    textStyle.push(styles.bold);
  }
  if (isItalic) {
    textStyle.push(styles.italic);
  }
  if (linkMark) {
    textStyle.push(styles.link);
  }

  const textElement = <Text style={textStyle}>{node.text}</Text>;

  // Link ise TouchableOpacity ile sar
  if (linkMark && linkMark.attrs?.href) {
    return (
      <Text
        style={[...textStyle]}
        onPress={() => Linking.openURL(linkMark.attrs.href)}
      >
        {node.text}
      </Text>
    );
  }

  return textElement;
}

/**
 * Stiller
 */
function createStyles(theme, selectedTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    text: {
      fontSize: 16,
      lineHeight: 26,
      color: theme.text,
      letterSpacing: 0.2,
    },
    bold: {
      fontWeight: "700",
    },
    italic: {
      fontStyle: "italic",
    },
    link: {
      color: theme.thirdBg || Colors.primary,
      textDecorationLine: "underline",
    },
    paragraph: {
      fontSize: 16,
      lineHeight: 26,
      color: theme.text,
      marginBottom: 16,
      letterSpacing: 0.2,
    },
    heading1: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.title || theme.text,
      marginTop: 28,
      marginBottom: 14,
      letterSpacing: -0.5,
    },
    heading2: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.title || theme.text,
      marginTop: 24,
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    heading3: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.title || theme.text,
      marginTop: 20,
      marginBottom: 10,
    },
    heading4: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.title || theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    heading5: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.title || theme.text,
      marginTop: 14,
      marginBottom: 6,
    },
    heading6: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.title || theme.text,
      marginTop: 12,
      marginBottom: 4,
    },
    bulletList: {
      marginVertical: 12,
      paddingLeft: 4,
    },
    orderedList: {
      marginVertical: 12,
      paddingLeft: 4,
    },
    listItem: {
      flexDirection: "row",
      marginBottom: 10,
      alignItems: "flex-start",
    },
    listBullet: {
      fontSize: 16,
      lineHeight: 26,
      color: theme.thirdBg || Colors.primary,
      width: 24,
      fontWeight: "700",
    },
    listItemContent: {
      flex: 1,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: theme.thirdBg || Colors.primary,
      paddingLeft: 16,
      paddingVertical: 8,
      marginVertical: 16,
      backgroundColor:
        selectedTheme === "dark"
          ? "rgba(255,255,255,0.05)"
          : "rgba(83,115,84,0.06)",
      borderRadius: 8,
    },
    image: {
      width: "100%",
      height: 220,
      borderRadius: 16,
      marginVertical: 16,
    },
  });
}
