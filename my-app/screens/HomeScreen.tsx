import React, { useState, useEffect } from 'react';
import { View, Image, Alert, ScrollView } from 'react-native';
import { Button } from 'react-native-elements';
import * as ImagePicker from 'expo-image-picker';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDmmGlgU4mmXfpqVyC8vDqb3WobtFrJoFA",
  authDomain: "atividade04-storage.firebaseapp.com",
  projectId: "atividade04-storage",
  storageBucket: "atividade04-storage.firebasestorage.app",
  messagingSenderId: "262880976182",
  appId: "1:262880976182:web:91f8f116ffafbadb626797",
  measurementId: "G-SEP24HT6HV"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

type UploadedImage = {
  url: string;
  fullPath: string;
};

const HomeScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Carregar imagens enviadas ao abrir a tela
  useEffect(() => {
    fetchUploadedImages();
  }, []);

  // Função para buscar as imagens enviadas do Firebase Storage
  const fetchUploadedImages = async () => {
    try {
      const listRef = ref(storage, 'images/');
      const response = await listAll(listRef);

      const images = await Promise.all(
        response.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { url, fullPath: itemRef.fullPath }; // Salva o caminho completo (fullPath)
        })
      );

      setUploadedImages(images);
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

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); // Corrigido para `assets[0].uri`
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

  // Função para excluir uma imagem do Firebase Storage usando o fullPath
  const deleteImage = async (fullPath: string) => {
    try {
      const imageRef = ref(storage, fullPath); // Usa o fullPath diretamente
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
      {uploadedImages.map((image, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
          <Image source={{ uri: image.url }} style={{ width: 80, height: 80, marginRight: 10 }} />
          <Button
            title="Excluir"
            buttonStyle={{ backgroundColor: 'green' }}
            onPress={() => deleteImage(image.fullPath)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default HomeScreen;