# Academy LMS - Free Cloud Deployment Guide

මෙම LMS MVP පද්ධතිය සම්පූර්ණයෙන්ම නොමිලේ අන්තර්ජාලය ඔස්සේ (Live Cloud Server) ක්‍රියාත්මක කරවා ගැනීම සඳහා වන උපදෙස් මාලාව.

මෙය ප්‍රධාන කොටස් 3කින් යුක්ත වේ:
1. **Database** (PostgreSQL) -> **Supabase** (නොමිලේ)
2. **Backend Server** (Express API) -> **Render** (නොමිලේ)
3. **Frontend Website** (React App) -> **Vercel** (නොමිලේ)

---

## පියවර 1: Supabase හරහා Database සකස් කිරීම

1. [Supabase](https://supabase.com/) වෙබ් අඩවියට ගොස් නොමිලේ ගිණුමක් (Free Account) සාදා ගන්න.
2. අලුත් **Project** එකක් සාදන්න:
   * Project Name: `academy-lms-db`
   * Database Password එකක් ලබා දී එය මතක තබා ගන්න.
   * Region එක ලෙස සිංගප්පූරුව (Singapore) තෝරන්න.
3. Project එක සෑදූ පසු, Database Connection String එක ලබා ගැනීමට ක්‍රම දෙකක් තිබේ:

   * **ක්‍රමය A (පහසුම ක්‍රමය):**
     * Project Dashboard එකෙහි ඉහළ දකුණු කෙළවරේ (Top Right) ඇති **Connect** කියන කොළ පාට බොත්තම (Button) ක්ලික් කරන්න.
     * එවිට විවෘත වන Popup එකෙන් **Connection String** යන්න තෝරා, **URI** යටතේ ඇති link එක copy කර ගන්න.

   * **ක්‍රමය B (Settings හරහා):**
     * වම්පස ඇති sidebar එකේ (left panel) පතුලටම වන්නට ඇති **ගියර් අයිකනය (⚙️ - Settings)** ක්ලික් කරන්න.
     * ඉන්පසු ලැබෙන මෙනු එකෙන් **Database** යන්න තෝරන්න.
     * පහළට scroll කර **Connection string** යටතේ ඇති **URI** යන්න තෝරා එහි ඇති link එක copy කර ගන්න.
   * එය මෙවැනි ආකාරයේ එකකි: `postgresql://postgres.[username]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
   * මෙහි `[password]` වෙනුවට ඔබ ලබා දුන් database password එක ඇතුළත් කළ යුතුය.

---

## පියවර 2: Render හරහා Backend සර්වර් එක සකස් කිරීම

1. ඔබගේ කේතයන් (source code) **GitHub** ගිණුමකට upload කරන්න.
2. [Render](https://render.com/) වෙබ් අඩවියට ගොස් GitHub හරහා ලොග් වන්න.
3. **New +** බොත්තම ඔබා **Web Service** යන්න තෝරන්න.
4. ඔබගේ GitHub repository එක Render එකට සම්බන්ධ (connect) කරන්න.
5. පහත විස්තර ඇතුළත් කරන්න:
   * **Name**: `academy-lms-backend`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
6. **Environment Variables** (පරිසර විචල්‍යයන්) යටතේ පහත ඒවා එකතු කරන්න:
   * `DATABASE_URL` = (Supabase වෙතින් ලබාගත් Connection URI එක)
   * `JWT_SECRET` = (ඕනෑම රහස්‍ය අකුරු/ඉලක්කම් වැලක් - උදා: `mySuperSecretToken123`)
   * `NODE_ENV` = `production`
7. **Deploy Web Service** බොත්තම ඔබන්න.
8. සර්වර් එක deploy වී අවසන් වූ පසු Render මඟින් ඔබට Live URL එකක් ලබා දේ (උදා: `https://academy-lms-backend.onrender.com`). එය copy කර ගන්න.

---

## පියවර 3: Database එකට වගු (Tables) සහ දත්ත එක් කිරීම (Seeding)

ඔබගේ සජීවී Supabase database එකට වගු සහ ඩෙමෝ දත්ත ඇතුළත් කිරීමට:
1. ඔබගේ පරිගණකයේ ඇති [backend/.env](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/academy-lms/backend/.env) ගොනුව තාවකාලිකව විවෘත කරන්න.
2. එහි ඇති `DATABASE_URL` එක වෙනුවට ඔබගේ සජීවී **Supabase URI** එක ආදේශ කර save කරන්න.
3. ඔබගේ පරිගණකයේ terminal එකෙන් backend folder එකට ගොස් පහත විධානය ධාවනය කරන්න:
   ```bash
   npm run seed
   ```
4. Seeding සාර්ථක වූ පසු, [backend/.env](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/academy-lms/backend/.env) ගොනුවේ `DATABASE_URL` එක නැවත සාමාන්‍ย පරිදි සකසන්න.

---

## පියවර 4: Vercel හරහා Frontend එක සජීවී කිරීම

1. [Vercel](https://vercel.com/) වෙබ් අඩවියට ගොස් GitHub හරහා ලොග් වන්න.
2. **Add New...** -> **Project** යන්න තෝරන්න.
3. ඔබගේ GitHub repository එක සම්බන්ධ කරන්න.
4. පහත විස්තර සකසන්න:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite` (මෙහි Vercel විසින් build/install commands auto-configure කරනු ඇත).
5. **Environment Variables** යටතේ පහත විචල්‍යය එක් කරන්න:
   * `VITE_API_URL` = (පියවර 2 හි Render වෙතින් ලැබුණු Backend URL එක - උදා: `https://academy-lms-backend.onrender.com`)
6. **Deploy** බොත්තම ඔබන්න.

දැන් Vercel මඟින් ඔබට සජීවී වෙබ් අඩවි ලිපිනයක් (URL) ලබා දෙනු ඇත (උදා: `https://academy-lms.vercel.app`). 

ඔබගේ සිසුන්ට සහ දේශකයන්ට එම සජීවී ලින්ක් එක හරහා ලෝකයේ ඕනෑම තැනක සිට LMS එකට පිවිසිය හැක!
