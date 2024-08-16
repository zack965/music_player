
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, ScrollView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

export default function App() {
  const [audioFiles, setAudioFiles] = useState<MediaLibrary.Asset[]>([]);
  const [AppCurrentAudio, setAppCurrentAudio] = useState<MediaLibrary.Asset | null>(null);
  const [soundApp, setSoundApp] = useState<Audio.Sound | null>(null);

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [IsAudioPlaying, setIsAudioPlaying] = useState(false)
  const [lastPlaybackPosition, setLastPlaybackPosition] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      // Request permission to access media files
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');

      if (status === 'granted') {
        fetchAudioFiles();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          // interruptionModeIOS: Audio,
          //interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
    })();
  }, []);
  const playSound = async (audio: MediaLibrary.Asset) => {
    if (audio) {
      setIsAudioPlaying(true)

      if (soundApp) {
        await soundApp.stopAsync();
        setLastPlaybackPosition(null);
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audio.uri });
      setSoundApp(sound);
      if (lastPlaybackPosition) {
        await sound.playFromPositionAsync(lastPlaybackPosition);
      } else {
        await sound.playAsync();
      }
    }
  };
  const playCurrentSound = async (audio: Audio.Sound | null) => {
    if (audio) {
      // console.log("object")
      const status = await audio.getStatusAsync();
      if (status.isLoaded) {
        setIsAudioPlaying(true)
        if (lastPlaybackPosition) {
          await audio.playFromPositionAsync(lastPlaybackPosition);
        } else {
          await audio.playAsync();
        }

      }
    }
  }

  const stopSound = async (audio: Audio.Sound | null) => {
    if (audio) {
      // setSoundApp(null)
      const status = await audio.getStatusAsync();
      if (status.isLoaded) {
        setLastPlaybackPosition(status.positionMillis);
      }
      setIsAudioPlaying(false)

      await audio.pauseAsync();
    }
  }


  const fetchAudioFiles = async () => {
    let media = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 1000, // Number of files to fetch, adjust as needed
    });
    const isEnglishLetter = (char: string) => /^[a-zA-Z]$/.test(char);

    // Sort the audio files based on the first character
    const sortedAudioFiles = media.assets
      .map(asset => ({
        ...asset,
        firstChar: asset.filename ? asset.filename[0].toUpperCase() : '',
      }))
      .sort((a, b) => {
        const charA = a.firstChar;
        const charB = b.firstChar;

        // Check if characters are non-English letters or numbers
        const isAEnglish = isEnglishLetter(charA);
        const isBEnglish = isEnglishLetter(charB);

        if (!isAEnglish && isBEnglish) {
          return 1; // Non-English letter or number should come after English letter
        }
        if (isAEnglish && !isBEnglish) {
          return -1; // English letter should come before non-English letter or number
        }

        // Both characters are either English or non-English, sort alphabetically
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
      <ScrollView style={{ width: "100%", height: "90%", paddingLeft: 20, paddingRight: 20, paddingTop: 40 }}>
        {audioFiles.map((item) => (
          <View key={item.id} style={{ marginBottom: 10, marginTop: 10 }}>
            <Text>{item.filename}</Text>
            <Button
              title="Play"
              onPress={() => {
                // TODO: Implement audio playback here
                setAppCurrentAudio(item)
                playSound(item)
              }}
            />
          </View>
        ))}
      </ScrollView>
      {AppCurrentAudio ? (
        <View style={{ width: "100%", height: "10%" }}>
          <View style={{ height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "#f6f6f6" }}>
            <Text>
              {AppCurrentAudio?.filename}

            </Text>
            {IsAudioPlaying ? <Button title="Stop Audio" onPress={() => {
              stopSound(soundApp)
            }} /> : <Button title="play Audio" onPress={() => {
              playCurrentSound(soundApp)
            }} />}

          </View>
        </View>
      ) : (
        <View style={{ width: "100%", height: "10%" }}>
          <View style={{ height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "#f6f6f6" }}>
            <Text>
              no adusio selected
            </Text>
          </View>
        </View>
      )}

    </View>
  );
}

/*


{permissionGranted ? (
        <FlatList
          style={{ height: '70%', }}
          data={audioFiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text>{item.filename}</Text>
          )}
        />
      ) : (
        <Text>Permission not granted to access media files.</Text>
      )}


      */