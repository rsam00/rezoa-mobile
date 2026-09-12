import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ht', label: 'HT' }
  ];

  const toggleDropdown = () => setIsOpen(!isOpen);

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.triggerButton} onPress={toggleDropdown}>
        <Text style={styles.triggerText}>{i18n.language.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={16} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay}>
            <View style={styles.dropdownMenu}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.menuItem,
                    i18n.language === lang.code && styles.menuItemActive
                  ]}
                  onPress={() => selectLanguage(lang.code)}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      i18n.language === lang.code && styles.menuItemTextActive
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  triggerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    paddingTop: 60,
    paddingRight: 20,
  },
  dropdownMenu: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 8,
    width: 60,
    borderWidth: 1,
    borderColor: '#3730a3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  menuItemActive: {
    backgroundColor: '#7c3aed',
  },
  menuItemText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
