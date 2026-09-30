# Color-Shift Physics: Chrono Jump ⚡🎮

Cyberpunk & Minimalist Neon uslubidagi giper-dinamik brauzer platformer o'yini.

## 🚀 O'yin Xususiyatlari
1. **Ranglar Fizikasi (Color-Shift Resonance)**:
   - O'yin davomida 3 xil fazali neon rang almashib turadi: **Cyan (Moviy)**, **Magenta (Pushti)** va **Lime (Yashil)**.
   - O'yinchi faqat shu paytda aktiv bo'lgan rangdagi platformalarga sakrashi mumkin. Noto'g'ri rangga tegish — vaqt tizimining halokati (Color Desync Game Over)!
2. **Vaqtni Boshqarish (Chrono Dilation)**:
   - `SPACE` yoki ekrandagi **SLOW** tugmasini bosib turganda vaqt 50% ga sekinlashadi.
   - Bu qiyin trayektoriyalarni hisoblab, to'g'ri rangdagi platformani tanlash imkonini beradi.
   - Chrono energiyasi shkalasi sarflanadi va vaqt o'tishi bilan qayta to'ladi.
3. **Sof Web Audio API Sintezatori**:
   - Hech qanday tashqi audio fayllarsiz to'liq algoritmik ovozlar: sakrashlar, rezonans ohanglari, sub-bass chrono sekinlashuvi va kiberpank ohanglar.
4. **Global Leaderboard (Supabase)**:
   - O'yinchilarning eng yuqori ballari `localStorage` bilan birga **Supabase PostgreSQL** bazasidagi onlayn reyting jadvalida saqlanadi.
5. **Zamonaviy Cyberpunk UI**:
   - CRT Scanlines, Neon Glow, Glassmorphism va silliq 60 FPS Canvas render.

## 🎮 Boshqaruv
- **Harakat**: `A` / `D` yoki `←` / `→` (Mobil qurilmalarda ekrandagi tugmalar)
- **Vaqtni sekinlashtirish**: `SPACE` yoki `Shift` (bosib turiladi)
- **Ekrandan o'tish**: Ekranning chap chetidan chiqib, o'ng chetidan kirish mumkin (Screen Wrap).

## 🛠 Texnologiyalar
- HTML5 Canvas & Vanilla JavaScript (ES6+)
- CSS3 Neon & Glassmorphism Design
- Web Audio API
- Supabase REST API (Global Leaderboard)
- Vercel Deployment
