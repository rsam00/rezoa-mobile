import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useContributions } from '../contexts/ContributionsContext';
import { useData } from '../contexts/DataContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ContributeProgramScreen() {
  const { stationId } = useLocalSearchParams();
  const { stations } = useData();
  const station = stations.find((s) => s.id === stationId);
  const router = useRouter();
  const { addContribution } = useContributions();

  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [schedules, setSchedules] = useState([{ startTime: '09:00', endTime: '10:00', days: [] as string[] }]);

  const toggleDay = (index: number, day: string) => {
    const newSchedules = [...schedules];
    const days = newSchedules[index].days;
    if (days.includes(day)) {
      newSchedules[index].days = days.filter((d) => d !== day);
    } else {
      newSchedules[index].days = [...days, day];
    }
    setSchedules(newSchedules);
  };

  const updateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const addScheduleSlot = () => {
    setSchedules([...schedules, { startTime: '09:00', endTime: '10:00', days: [] }]);
  };

  const removeScheduleSlot = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a program name.');
      return;
    }
    if (schedules.some((s) => s.days.length === 0)) {
      Alert.alert('Error', 'Please select at least one day for each schedule slot.');
      return;
    }
    try {
      await addContribution({
        stationId: stationId as string,
        name,
        host,
        description,
        schedules,
      });
      Alert.alert('Success', 'Thank you for your contribution!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save contribution.');
    }
  };

  if (!station) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e1b4b', '#000']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Program</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButtonHeader}>
          <Text style={styles.submitButtonTextHeader}>SAVE</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.stationBanner}>
             <Text style={styles.contributingTo}>CONTRIBUTING TO</Text>
             <Text style={styles.stationName}>{station.name}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>PROGRAM NAME</Text>
            <TextInput style={styles.input} placeholder="e.g. Matinée Musicale" placeholderTextColor="#52525b" value={name} onChangeText={setName} />
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>HOST NAME (OPTIONAL)</Text>
            <TextInput style={styles.input} placeholder="e.g. Jean Pierre" placeholderTextColor="#52525b" value={host} onChangeText={setHost} />
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="What is this program about?" placeholderTextColor="#52525b" multiline numberOfLines={4} value={description} onChangeText={setDescription} />
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>SCHEDULE</Text>
              <TouchableOpacity onPress={addScheduleSlot}>
                <Text style={styles.addSlotButton}>+ ADD SLOT</Text>
              </TouchableOpacity>
            </View>
            {schedules.map((sch, idx) => (
              <View key={idx} style={styles.scheduleSlot}>
                <View style={styles.slotHeader}>
                   <Text style={styles.slotLabel}>Slot {idx + 1}</Text>
                   {schedules.length > 1 && (
                     <TouchableOpacity onPress={() => removeScheduleSlot(idx)}>
                       <Text style={styles.removeSlotText}>Remove</Text>
                     </TouchableOpacity>
                   )}
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>START</Text>
                    <TextInput style={styles.timeInput} value={sch.startTime} onChangeText={(v) => updateTime(idx, 'startTime', v)} placeholder="00:00" placeholderTextColor="#52525b" />
                  </View>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>END</Text>
                    <TextInput style={styles.timeInput} value={sch.endTime} onChangeText={(v) => updateTime(idx, 'endTime', v)} placeholder="00:00" placeholderTextColor="#52525b" />
                  </View>
                </View>
                <View style={styles.daysRow}>
                  {DAYS.map((day) => (
                    <TouchableOpacity key={day} onPress={() => toggleDay(idx, day)} style={[styles.dayButton, sch.days.includes(day) && styles.dayButtonActive]}>
                      <Text style={[styles.dayText, sch.days.includes(day) && styles.dayTextActive]}>{day.substring(0, 1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.mainSubmitButton} onPress={handleSubmit}>
             <LinearGradient colors={['#a78bfa', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Text style={styles.mainSubmitButtonText}>SUBMIT CONTRIBUTION</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  closeButton: { width: 32, height: 32, justifyContent: 'center' },
  closeButtonText: { color: '#fff', fontSize: 20, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  submitButtonHeader: { backgroundColor: 'rgba(167, 139, 250, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.3)' },
  submitButtonTextHeader: { color: '#a78bfa', fontSize: 12, fontWeight: '900' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  stationBanner: { marginBottom: 30, alignItems: 'center' },
  contributingTo: { color: '#a1a1aa', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  stationName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  section: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: '#71717a', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { height: 100, textAlignVertical: 'top' },
  scheduleSlot: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  slotLabel: { color: '#a78bfa', fontSize: 12, fontWeight: '700' },
  removeSlotText: { color: '#ef4444', fontSize: 12 },
  addSlotButton: { color: '#a78bfa', fontSize: 11, fontWeight: '900' },
  timeRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  timeInputContainer: { flex: 1 },
  timeLabel: { color: '#52525b', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  timeInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 10, color: '#fff', fontSize: 15, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dayButtonActive: { backgroundColor: '#a78bfa', borderColor: '#a78bfa' },
  dayText: { color: '#71717a', fontSize: 14, fontWeight: '700' },
  dayTextActive: { color: '#000' },
  mainSubmitButton: { height: 56, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  mainSubmitButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});
// Rezoa Contribute Program Screen - Corrected Version 1:05 PM
