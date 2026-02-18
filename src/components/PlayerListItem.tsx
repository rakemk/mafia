import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlayerListItemProps {
  username: string;
  role?: string;
  isAlive: boolean;
  isHost?: boolean;
}

export function PlayerListItem({
  username,
  role,
  isAlive,
  isHost,
}: PlayerListItemProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: isAlive ? '#00ff00' : '#ff0000' },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>{username}</Text>
          {isHost && <Text style={styles.host}>HOST</Text>}
        </View>
        {role && <Text style={styles.role}>{role}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f0f1e',
    borderBottomWidth: 1,
    borderBottomColor: '#00ff00',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  host: {
    color: '#00ff00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  role: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
});
