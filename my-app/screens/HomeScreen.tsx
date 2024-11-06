import * as ImagePicker from 'expo-image-picker';
import firebase, { initializeApp } from 'firebase/app';
import 'firebase/storage';
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { Button } from 'react-native-elements';
import { v4 as uuidv4 } from 'uuid';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

if (!firebase.apps.length) {
  initializeApp(firebaseConfig);
}
const storage = getStorage();

const HomeScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Carregar imagens enviadas ao abrir a tela
  useEffect(() => {
    fetchUploadedImages();
  }, []);

  // Função para buscar as imagens enviadas do Firebase Storage
  const fetchUploadedImages = async () => {
    try {
      const listRef = ref(storage, 'images/');
      const response = await listAll(listRef);
      const urls = await Promise.all(response.items.map((itemRef) => getDownloadURL(itemRef)));
      setUploadedImages(urls);
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
    }
  };

  // Função para abrir o seletor de imagens
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
    }
  };

  // Função para fazer o upload da imagem selecionada para o Firebase Storage
  const uploadImage = async () => {
    if (!selectedImage) return;

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const imageRef = ref(storage, `images/${uuidv4()}`);
      await uploadBytes(imageRef, blob);
      Alert.alert('Imagem enviada com sucesso!');
      setSelectedImage(null);
      fetchUploadedImages(); // Atualiza a lista de imagens
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
    }
  };

  // Função para excluir uma imagem do Firebase Storage
  const deleteImage = async (url: string) => {
    try {
      const imageRef = ref(storage, url.split('.appspot.com/o/')[1].split('?')[0].replace('%2F', '/'));
      await deleteObject(imageRef);
      Alert.alert('Imagem excluída com sucesso!');
      fetchUploadedImages(); // Atualiza a lista de imagens após a exclusão
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
      {/* Botão Escolher Imagem */}
      <Button
        title="Escolher Imagem"
        buttonStyle={{ backgroundColor: 'green', marginBottom: 10 }}
        onPress={pickImage}
      />

      {/* Pré-visualização da Imagem Selecionada */}
      {selectedImage && (
        <Image
          source={{ uri: selectedImage }}
          style={{ width: 200, height: 200, marginVertical: 10 }}
        />
      )}

      {/* Botão Enviar */}
      <Button
        title="Enviar"
        buttonStyle={{ backgroundColor: 'green', marginBottom: 20 }}
        onPress={uploadImage}
        disabled={!selectedImage}
      />

      {/* Lista de Imagens Enviadas */}
      {uploadedImages.map((url, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
          <Image source={{ uri: url }} style={{ width: 80, height: 80, marginRight: 10 }} />
          <Button
            title="Excluir"
            buttonStyle={{ backgroundColor: 'green' }}
            onPress={() => deleteImage(url)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default HomeScreen;
