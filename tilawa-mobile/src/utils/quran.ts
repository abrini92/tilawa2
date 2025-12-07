/**
 * Qur'an Utilities
 *
 * Surah names and related helpers.
 */

export const SURAH_NAMES: Record<number, { arabic: string; english: string; transliteration: string }> = {
  1: { arabic: 'الفاتحة', english: 'The Opening', transliteration: 'Al-Fatiha' },
  2: { arabic: 'البقرة', english: 'The Cow', transliteration: 'Al-Baqarah' },
  3: { arabic: 'آل عمران', english: 'The Family of Imran', transliteration: 'Ali \'Imran' },
  4: { arabic: 'النساء', english: 'The Women', transliteration: 'An-Nisa' },
  5: { arabic: 'المائدة', english: 'The Table Spread', transliteration: 'Al-Ma\'idah' },
  6: { arabic: 'الأنعام', english: 'The Cattle', transliteration: 'Al-An\'am' },
  7: { arabic: 'الأعراف', english: 'The Heights', transliteration: 'Al-A\'raf' },
  8: { arabic: 'الأنفال', english: 'The Spoils of War', transliteration: 'Al-Anfal' },
  9: { arabic: 'التوبة', english: 'The Repentance', transliteration: 'At-Tawbah' },
  10: { arabic: 'يونس', english: 'Jonah', transliteration: 'Yunus' },
  11: { arabic: 'هود', english: 'Hud', transliteration: 'Hud' },
  12: { arabic: 'يوسف', english: 'Joseph', transliteration: 'Yusuf' },
  13: { arabic: 'الرعد', english: 'The Thunder', transliteration: 'Ar-Ra\'d' },
  14: { arabic: 'إبراهيم', english: 'Abraham', transliteration: 'Ibrahim' },
  15: { arabic: 'الحجر', english: 'The Rocky Tract', transliteration: 'Al-Hijr' },
  16: { arabic: 'النحل', english: 'The Bee', transliteration: 'An-Nahl' },
  17: { arabic: 'الإسراء', english: 'The Night Journey', transliteration: 'Al-Isra' },
  18: { arabic: 'الكهف', english: 'The Cave', transliteration: 'Al-Kahf' },
  19: { arabic: 'مريم', english: 'Mary', transliteration: 'Maryam' },
  20: { arabic: 'طه', english: 'Ta-Ha', transliteration: 'Ta-Ha' },
  21: { arabic: 'الأنبياء', english: 'The Prophets', transliteration: 'Al-Anbiya' },
  22: { arabic: 'الحج', english: 'The Pilgrimage', transliteration: 'Al-Hajj' },
  23: { arabic: 'المؤمنون', english: 'The Believers', transliteration: 'Al-Mu\'minun' },
  24: { arabic: 'النور', english: 'The Light', transliteration: 'An-Nur' },
  25: { arabic: 'الفرقان', english: 'The Criterion', transliteration: 'Al-Furqan' },
  26: { arabic: 'الشعراء', english: 'The Poets', transliteration: 'Ash-Shu\'ara' },
  27: { arabic: 'النمل', english: 'The Ant', transliteration: 'An-Naml' },
  28: { arabic: 'القصص', english: 'The Stories', transliteration: 'Al-Qasas' },
  29: { arabic: 'العنكبوت', english: 'The Spider', transliteration: 'Al-\'Ankabut' },
  30: { arabic: 'الروم', english: 'The Romans', transliteration: 'Ar-Rum' },
  31: { arabic: 'لقمان', english: 'Luqman', transliteration: 'Luqman' },
  32: { arabic: 'السجدة', english: 'The Prostration', transliteration: 'As-Sajdah' },
  33: { arabic: 'الأحزاب', english: 'The Combined Forces', transliteration: 'Al-Ahzab' },
  34: { arabic: 'سبأ', english: 'Sheba', transliteration: 'Saba' },
  35: { arabic: 'فاطر', english: 'Originator', transliteration: 'Fatir' },
  36: { arabic: 'يس', english: 'Ya-Sin', transliteration: 'Ya-Sin' },
  37: { arabic: 'الصافات', english: 'Those Who Set The Ranks', transliteration: 'As-Saffat' },
  38: { arabic: 'ص', english: 'Sad', transliteration: 'Sad' },
  39: { arabic: 'الزمر', english: 'The Troops', transliteration: 'Az-Zumar' },
  40: { arabic: 'غافر', english: 'The Forgiver', transliteration: 'Ghafir' },
  41: { arabic: 'فصلت', english: 'Explained in Detail', transliteration: 'Fussilat' },
  42: { arabic: 'الشورى', english: 'The Consultation', transliteration: 'Ash-Shura' },
  43: { arabic: 'الزخرف', english: 'The Ornaments of Gold', transliteration: 'Az-Zukhruf' },
  44: { arabic: 'الدخان', english: 'The Smoke', transliteration: 'Ad-Dukhan' },
  45: { arabic: 'الجاثية', english: 'The Crouching', transliteration: 'Al-Jathiyah' },
  46: { arabic: 'الأحقاف', english: 'The Wind-Curved Sandhills', transliteration: 'Al-Ahqaf' },
  47: { arabic: 'محمد', english: 'Muhammad', transliteration: 'Muhammad' },
  48: { arabic: 'الفتح', english: 'The Victory', transliteration: 'Al-Fath' },
  49: { arabic: 'الحجرات', english: 'The Rooms', transliteration: 'Al-Hujurat' },
  50: { arabic: 'ق', english: 'Qaf', transliteration: 'Qaf' },
  51: { arabic: 'الذاريات', english: 'The Winnowing Winds', transliteration: 'Adh-Dhariyat' },
  52: { arabic: 'الطور', english: 'The Mount', transliteration: 'At-Tur' },
  53: { arabic: 'النجم', english: 'The Star', transliteration: 'An-Najm' },
  54: { arabic: 'القمر', english: 'The Moon', transliteration: 'Al-Qamar' },
  55: { arabic: 'الرحمن', english: 'The Beneficent', transliteration: 'Ar-Rahman' },
  56: { arabic: 'الواقعة', english: 'The Inevitable', transliteration: 'Al-Waqi\'ah' },
  57: { arabic: 'الحديد', english: 'The Iron', transliteration: 'Al-Hadid' },
  58: { arabic: 'المجادلة', english: 'The Pleading Woman', transliteration: 'Al-Mujadila' },
  59: { arabic: 'الحشر', english: 'The Exile', transliteration: 'Al-Hashr' },
  60: { arabic: 'الممتحنة', english: 'She That Is To Be Examined', transliteration: 'Al-Mumtahanah' },
  61: { arabic: 'الصف', english: 'The Ranks', transliteration: 'As-Saf' },
  62: { arabic: 'الجمعة', english: 'The Congregation', transliteration: 'Al-Jumu\'ah' },
  63: { arabic: 'المنافقون', english: 'The Hypocrites', transliteration: 'Al-Munafiqun' },
  64: { arabic: 'التغابن', english: 'The Mutual Disillusion', transliteration: 'At-Taghabun' },
  65: { arabic: 'الطلاق', english: 'The Divorce', transliteration: 'At-Talaq' },
  66: { arabic: 'التحريم', english: 'The Prohibition', transliteration: 'At-Tahrim' },
  67: { arabic: 'الملك', english: 'The Sovereignty', transliteration: 'Al-Mulk' },
  68: { arabic: 'القلم', english: 'The Pen', transliteration: 'Al-Qalam' },
  69: { arabic: 'الحاقة', english: 'The Reality', transliteration: 'Al-Haqqah' },
  70: { arabic: 'المعارج', english: 'The Ascending Stairways', transliteration: 'Al-Ma\'arij' },
  71: { arabic: 'نوح', english: 'Noah', transliteration: 'Nuh' },
  72: { arabic: 'الجن', english: 'The Jinn', transliteration: 'Al-Jinn' },
  73: { arabic: 'المزمل', english: 'The Enshrouded One', transliteration: 'Al-Muzzammil' },
  74: { arabic: 'المدثر', english: 'The Cloaked One', transliteration: 'Al-Muddaththir' },
  75: { arabic: 'القيامة', english: 'The Resurrection', transliteration: 'Al-Qiyamah' },
  76: { arabic: 'الإنسان', english: 'The Man', transliteration: 'Al-Insan' },
  77: { arabic: 'المرسلات', english: 'The Emissaries', transliteration: 'Al-Mursalat' },
  78: { arabic: 'النبأ', english: 'The Tidings', transliteration: 'An-Naba' },
  79: { arabic: 'النازعات', english: 'Those Who Drag Forth', transliteration: 'An-Nazi\'at' },
  80: { arabic: 'عبس', english: 'He Frowned', transliteration: '\'Abasa' },
  81: { arabic: 'التكوير', english: 'The Overthrowing', transliteration: 'At-Takwir' },
  82: { arabic: 'الانفطار', english: 'The Cleaving', transliteration: 'Al-Infitar' },
  83: { arabic: 'المطففين', english: 'The Defrauding', transliteration: 'Al-Mutaffifin' },
  84: { arabic: 'الانشقاق', english: 'The Sundering', transliteration: 'Al-Inshiqaq' },
  85: { arabic: 'البروج', english: 'The Mansions of the Stars', transliteration: 'Al-Buruj' },
  86: { arabic: 'الطارق', english: 'The Nightcomer', transliteration: 'At-Tariq' },
  87: { arabic: 'الأعلى', english: 'The Most High', transliteration: 'Al-A\'la' },
  88: { arabic: 'الغاشية', english: 'The Overwhelming', transliteration: 'Al-Ghashiyah' },
  89: { arabic: 'الفجر', english: 'The Dawn', transliteration: 'Al-Fajr' },
  90: { arabic: 'البلد', english: 'The City', transliteration: 'Al-Balad' },
  91: { arabic: 'الشمس', english: 'The Sun', transliteration: 'Ash-Shams' },
  92: { arabic: 'الليل', english: 'The Night', transliteration: 'Al-Layl' },
  93: { arabic: 'الضحى', english: 'The Morning Hours', transliteration: 'Ad-Duha' },
  94: { arabic: 'الشرح', english: 'The Relief', transliteration: 'Ash-Sharh' },
  95: { arabic: 'التين', english: 'The Fig', transliteration: 'At-Tin' },
  96: { arabic: 'العلق', english: 'The Clot', transliteration: 'Al-\'Alaq' },
  97: { arabic: 'القدر', english: 'The Power', transliteration: 'Al-Qadr' },
  98: { arabic: 'البينة', english: 'The Clear Proof', transliteration: 'Al-Bayyinah' },
  99: { arabic: 'الزلزلة', english: 'The Earthquake', transliteration: 'Az-Zalzalah' },
  100: { arabic: 'العاديات', english: 'The Courser', transliteration: 'Al-\'Adiyat' },
  101: { arabic: 'القارعة', english: 'The Calamity', transliteration: 'Al-Qari\'ah' },
  102: { arabic: 'التكاثر', english: 'The Rivalry in World Increase', transliteration: 'At-Takathur' },
  103: { arabic: 'العصر', english: 'The Declining Day', transliteration: 'Al-\'Asr' },
  104: { arabic: 'الهمزة', english: 'The Traducer', transliteration: 'Al-Humazah' },
  105: { arabic: 'الفيل', english: 'The Elephant', transliteration: 'Al-Fil' },
  106: { arabic: 'قريش', english: 'Quraysh', transliteration: 'Quraysh' },
  107: { arabic: 'الماعون', english: 'The Small Kindnesses', transliteration: 'Al-Ma\'un' },
  108: { arabic: 'الكوثر', english: 'The Abundance', transliteration: 'Al-Kawthar' },
  109: { arabic: 'الكافرون', english: 'The Disbelievers', transliteration: 'Al-Kafirun' },
  110: { arabic: 'النصر', english: 'The Divine Support', transliteration: 'An-Nasr' },
  111: { arabic: 'المسد', english: 'The Palm Fiber', transliteration: 'Al-Masad' },
  112: { arabic: 'الإخلاص', english: 'The Sincerity', transliteration: 'Al-Ikhlas' },
  113: { arabic: 'الفلق', english: 'The Daybreak', transliteration: 'Al-Falaq' },
  114: { arabic: 'الناس', english: 'Mankind', transliteration: 'An-Nas' },
};

/**
 * Get surah name by number (1-114)
 */
export const getSurahName = (surahNumber: number): string => {
  const surah = SURAH_NAMES[surahNumber];
  return surah?.transliteration || `Surah ${surahNumber}`;
};

/**
 * Get full surah info
 */
export const getSurahInfo = (surahNumber: number) => {
  return SURAH_NAMES[surahNumber] || null;
};

/**
 * Get Arabic surah name
 */
export const getSurahArabicName = (surahNumber: number): string => {
  const surah = SURAH_NAMES[surahNumber];
  return surah?.arabic || '';
};
