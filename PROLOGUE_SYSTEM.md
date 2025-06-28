# 🎭 Sistem Prolog Dinamis - Bocchi the Rock! Roleplay Game

## 📋 Overview

Sistem Prolog Dinamis adalah fitur onboarding yang immersive dan interaktif yang memberikan pengalaman pertama yang memorable bagi pemain baru. Sistem ini menggunakan Discord Buttons untuk menciptakan pengalaman yang terasa seperti game visual novel.

## 🎯 Tujuan

- **Immersive Onboarding**: Memberikan pengalaman pertama yang engaging
- **Character Introduction**: Memperkenalkan dunia dan karakter Kessoku Band
- **Interactive Storytelling**: Menggunakan buttons untuk pilihan yang meaningful
- **Origin Story Integration**: Menyesuaikan narasi berdasarkan latar belakang pemain

## 🏗️ Arsitektur Sistem

### 1. **Core Files**

```
game_logic/prologue.js          # Sistem prolog utama
handlers/buttonHandler.js       # Handler untuk button interactions
commands/start.js               # Command yang dimodifikasi untuk trigger prolog
```

### 2. **Flow Diagram**

```
/start_life command
    ↓
Player Registration
    ↓
startPrologue() triggered
    ↓
Phase 1: Welcome & Setting
    ↓
Player chooses action (Buttons)
    ↓
Phase 2: Choice Consequences
    ↓
Phase 3: First Encounter
    ↓
Phase 4: Conclusion & Transition
```

## 🎮 Fase-Fase Prolog

### **Fase 1: Welcome & Setting Introduction**
- **Tujuan**: Memperkenalkan dunia dan konteks
- **Konten**: Deskripsi situasi berdasarkan origin story
- **Interaksi**: 3 pilihan button (Explore, Observe, Approach)
- **Output**: Embed dengan konteks waktu JST dan cuaca

### **Fase 2: Choice Consequences**
- **Tujuan**: Memberikan konsekuensi dari pilihan pemain
- **Konten**: Narasi yang berbeda untuk setiap pilihan
- **Interaksi**: Button "Continue" untuk lanjut
- **Output**: Embed dengan hasil eksplorasi/observasi/pendekatan

### **Fase 3: First Encounter**
- **Tujuan**: Memperkenalkan Kessoku Band
- **Konten**: Pertemuan pertama dengan keempat karakter utama
- **Interaksi**: Button "Finish Prologue"
- **Output**: Embed dengan deskripsi karakter dan musik

### **Fase 4: Conclusion & Transition**
- **Tujuan**: Transisi ke gameplay normal
- **Konten**: Goals, tips, dan langkah selanjutnya
- **Interaksi**: Tidak ada (selesai)
- **Output**: Embed dengan panduan gameplay

## 📝 Origin Story Variations

### **1. Siswa Pindahan**
```javascript
Location: 🏫 SMA Shuka
Theme: Hari pertama di sekolah baru
Focus: Adaptasi dan pencarian teman
Weather: "Cerah - Hari pertama yang menjanjikan"
```

### **2. Pekerja Baru di STARRY**
```javascript
Location: 🎸 STARRY Live House
Theme: Hari pertama kerja di live house
Focus: Profesionalisme dan dunia musik
Weather: "Hangat - Suasana live house yang nyaman"
```

### **3. Musisi Jalanan**
```javascript
Location: 🎵 Shimokitazawa Street
Theme: Pencarian kolaborasi musik
Focus: Transisi dari solo ke band
Weather: "Berawan - Seperti suasana hati yang kompleks"
```

## 🎨 Content Generation

### **Explore Content**
- **Siswa Pindahan**: Menemukan ruang musik dan suara gitar nervous
- **Pekerja STARRY**: Berkeliling venue dan menemukan equipment Kessoku Band
- **Musisi Jalanan**: Walk around dan mendengar sound check dari STARRY

### **Observe Content**
- **Siswa Pindahan**: Mengamati gadis pink nervous menuju ruang musik
- **Pekerja STARRY**: Observe dynamic dan melihat gadis kuning yang organized
- **Musisi Jalanan**: Observe scene musik dan melihat bassist yang cool

### **Approach Content**
- **Siswa Pindahan**: Approach siswa friendly dan dengar tentang Kessoku Band
- **Pekerja STARRY**: Approach staff dan learn tentang band reguler
- **Musisi Jalanan**: Approach fellow musician dan discover collaboration opportunities

## 🔧 Technical Implementation

### **Button System**
```javascript
// Button ID Format: prologue_{action}_{originStory}
"prologue_explore_siswa_pindahan"
"prologue_observe_pekerja_starry"
"prologue_approach_musisi_jalanan"
"prologue_continue_{originStory}"
"prologue_finish_{originStory}"
```

### **Error Handling**
- **Fallback System**: Jika prolog gagal, fallback ke konfirmasi sederhana
- **Button Validation**: Validasi format button ID sebelum processing
- **Interaction Safety**: Proper handling untuk replied/deferred interactions

### **Integration Points**
- **Start Command**: Modified untuk trigger prolog instead of simple confirmation
- **Button Handler**: Centralized handler untuk semua button interactions
- **Context Builder**: Integration dengan sistem konteks waktu JST
- **Weather System**: Integration dengan sistem cuaca untuk atmosphere

## 📊 User Experience Flow

### **1. Registration**
```
User: /start_life origin_story:siswa_pindahan
Bot: [Prolog Phase 1 Embed with 3 buttons]
```

### **2. Choice Making**
```
User: [Clicks "🚶 Jelajahi Sekitar"]
Bot: [Prolog Phase 2 Embed with continue button]
```

### **3. Progression**
```
User: [Clicks "➡️ Lanjutkan"]
Bot: [Prolog Phase 3 Embed with finish button]
```

### **4. Completion**
```
User: [Clicks "🌟 Selesaikan Prolog"]
Bot: [Prolog Phase 4 Embed - no buttons, ready for gameplay]
```

## 🎯 Benefits

### **For Players**
- **Engaging Introduction**: Tidak boring seperti text wall biasa
- **Character Investment**: Merasa connected dengan dunia dan karakter
- **Clear Direction**: Tahu apa yang harus dilakukan selanjutnya
- **Immersive Experience**: Terasa seperti bermain visual novel

### **For Developers**
- **Modular System**: Easy to extend dengan content baru
- **Reusable Components**: Button handler bisa digunakan untuk fitur lain
- **Error Resilient**: Robust error handling dan fallback systems
- **Analytics Ready**: Easy to track user choices dan behavior

## 🔮 Future Enhancements

### **Possible Additions**
- **Character-Specific Prologs**: Prolog yang berbeda jika fokus ke karakter tertentu
- **Seasonal Variations**: Prolog yang berubah berdasarkan waktu/season
- **Achievement System**: Unlock special content berdasarkan pilihan prolog
- **Replay System**: Kemampuan untuk replay prolog dengan pilihan berbeda

### **Technical Improvements**
- **Modal Integration**: Gunakan modals untuk input yang lebih complex
- **Select Menu Integration**: Dropdown choices untuk variasi yang lebih banyak
- **Animation Effects**: Typing effects atau progressive reveal
- **Voice Integration**: Audio narration untuk immersion yang lebih tinggi

## 📈 Success Metrics

### **Engagement Metrics**
- **Completion Rate**: Berapa persen pemain yang menyelesaikan prolog
- **Choice Distribution**: Pilihan mana yang paling populer
- **Time Spent**: Berapa lama pemain menghabiskan waktu di prolog
- **Retention**: Apakah pemain yang complete prolog lebih likely untuk continue

### **Quality Metrics**
- **Error Rate**: Berapa sering prolog mengalami error
- **Button Response Time**: Seberapa cepat button interactions diproses
- **User Feedback**: Rating atau feedback tentang prolog experience

## 🎉 Conclusion

Sistem Prolog Dinamis berhasil mengubah pengalaman onboarding dari simple text confirmation menjadi interactive storytelling experience yang engaging. Dengan integration yang seamless dengan sistem existing dan error handling yang robust, sistem ini ready untuk production dan memberikan first impression yang memorable bagi setiap pemain baru.

**Status: ✅ Production Ready**
**Last Updated: 2025-06-28**
**Version: 1.0.0**
