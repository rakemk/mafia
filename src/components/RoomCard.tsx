import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface RoomCardProps {
  name: string;
  code: string;
  players: number;
  maxPlayers: number;
  host: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function RoomCard({
  name,
  code,
  players,
  maxPlayers,
  host,
  onPress,
  style,
}: RoomCardProps) {
  const isFull = players >= maxPlayers;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isFull && styles.containerFull,
        style,
      ]}
      onPress={onPress}
      disabled={isFull}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.code}>{code}</Text>
      </View>

      <Text style={styles.host}>Hosted by {host}</Text>

      <View style={styles.footer}>
        <Text style={styles.players}>
          {players}/{maxPlayers} Players
        </Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isFull ? '#ff0000' : '#00ff00',
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isFull ? 'Full' : 'Waiting'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  containerFull: {
    borderColor: '#ff0000',
    opacity: 0.5,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  code: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  host: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  players: {
    color: '#fff',
    fontSize: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
});
