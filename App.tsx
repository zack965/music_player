import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

export default function App() {
  const [audioFiles, setAudioFiles] = useState<MediaLibrary.Asset[]>([]);
  const [AppCurrentAudio, setAppCurrentAudio] = useState<MediaLibrary.Asset | null>(null);
  const [soundApp, setSoundApp] = useState<Audio.Sound | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  // const [IsAudioPlaying, setIsAudioPlaying] = useState(false);
  const [lastPlaybackPosition, setLastPlaybackPosition] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');

      if (status === 'granted') {
        fetchAudioFiles();

      }
    })();
  }, []);

  const preloadSound = async (audio: MediaLibrary.Asset) => {
    if (audio) {
      if (soundApp) {
        await soundApp.unloadAsync();
        setSoundApp(null);
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audio.uri });
      setSoundApp(sound);
    }
  };

  const playSound = async () => {
    if (soundApp) {
      // setIsAudioPlaying(true);

      if (lastPlaybackPosition) {
        await soundApp.playFromPositionAsync(lastPlaybackPosition);
      } else {
        await soundApp.playAsync();
      }
    }
  };

  const stopSound = async () => {
    if (soundApp) {
      const status = await soundApp.getStatusAsync();
      if (status.isLoaded) {
        setLastPlaybackPosition(status.positionMillis);
        await soundApp.pauseAsync();
      }
      // setIsAudioPlaying(false);
    }
  };

  const fetchAudioFiles = async () => {
    let media = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 1000,
    });

    const isEnglishLetter = (char: string) => /^[a-zA-Z]$/.test(char);

    const sortedAudioFiles = media.assets
      .map(asset => ({
        ...asset,
        firstChar: asset.filename ? asset.filename[0].toUpperCase() : '',
      }))
      .sort((a, b) => {
        const charA = a.firstChar;
        const charB = b.firstChar;
        const isAEnglish = isEnglishLetter(charA);
        const isBEnglish = isEnglishLetter(charB);

        if (!isAEnglish && isBEnglish) {
          return 1;
        }
        if (isAEnglish && !isBEnglish) {
          return -1;
        }
        if (charA < charB) {
          return -1;
        }
        if (charA > charB) {
          return 1;
        }
        return 0;
      });

    setAudioFiles(sortedAudioFiles);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ width: '100%', height: '90%', paddingLeft: 20, paddingRight: 20, paddingTop: 40 }}>
        {audioFiles.map((item) => (
          <View key={item.id} style={{ marginBottom: 10, marginTop: 10 }}>
            <Text>{item.filename}</Text>
            <Button
              title="Load & Play"
              onPress={async () => {
                setAppCurrentAudio(item);
                await preloadSound(item);
                playSound();
              }}
            />
          </View>
        ))}
      </ScrollView>
      {AppCurrentAudio ? (
        <View style={{ width: '100%', height: '10%' }}>
          <View style={{ height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6f6' }}>
            <Text>{AppCurrentAudio?.filename}</Text>

            <Button title="Play Audio" onPress={playSound} />

            <Button title="Pause Audio" onPress={stopSound} />

          </View>
        </View>
      ) : (
        <View style={{ width: '100%', height: '10%' }}>
          <View style={{ height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6f6' }}>
            <Text>No audio selected</Text>
          </View>
        </View>
      )}
    </View>
  );
}
