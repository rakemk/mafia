import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatMessageProps {
  username: string;
  message: string;
  timestamp?: string;
}

export function ChatMessage({ username, message, timestamp }: ChatMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.message}>{message}</Text>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
  },
  username: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
});
