# Image Assets for Jeffrey Buongiorno Campaign

**Official image URLs from jeffbuongiorno.com**

---

## 🎨 Campaign Logos

### 1. Main Logo (Color Version)
**URL:** `https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png`

**Specifications:**
- Format: PNG with transparency
- Colors: Red (#C14644) and Navy Blue (#000033)
- Best for: White or light backgrounds
- Usage: Headers, email tops, article intros

**HTML Example:**
```html
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png" 
     alt="Jeff Buongiorno for Congress" 
     style="max-width: 300px; height: auto;">
```

---

### 2. White Logo (for Dark Backgrounds)
**URL:** `https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png`

**Specifications:**
- Format: PNG with transparency
- Color: White (#FFFFFF)
- Best for: Navy blue or red backgrounds
- Usage: Dark header sections, footer areas

**HTML Example:**
```html
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png" 
     alt="Jeff Buongiorno for Congress" 
     style="max-width: 300px; height: auto;">
```

---

## 👤 Portrait Images

### 3. Portrait Cutout (Transparent Background)
**URL:** `https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/bongiman4sml.png`

**Specifications:**
- Format: PNG with transparency
- Framing: Professional shot, waist-up
- Background: Transparent (can overlay on any color/image)
- Best for: Hero sections, signature areas, about sections

**HTML Example:**
```html
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/bongiman4sml.png" 
     alt="Jeffrey Buongiorno" 
     style="max-width: 400px; height: auto;">
```

**Creative Uses:**
- Overlay on flag background for hero images
- Side-by-side with text in "About Jeff" sections
- Signature area at end of articles
- Social media graphics

---

## 🇺🇸 Background Images

### 4. Flag Background
**URL:** `https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png`

**Specifications:**
- Format: PNG
- Style: American flag motif (red, white, blue)
- Best for: Hero section backgrounds, patriotic overlays
- Recommended overlay: Semi-transparent dark layer for text readability

**HTML Example (as background):**
```html
<div style="background-image: url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png'); 
            background-size: cover; 
            background-position: center; 
            padding: 50px 30px;">
    <!-- Content here -->
</div>
```

**HTML Example (with overlay for text readability):**
```html
<div style="background: linear-gradient(rgba(0, 0, 51, 0.85), rgba(0, 0, 51, 0.85)), 
                        url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png'); 
            background-size: cover; 
            background-position: center; 
            padding: 50px 30px;">
    <h1 style="color: white;">Text will be readable here</h1>
</div>
```

---

## 🎨 Recommended Color Overlays

When using the flag background with text, add a semi-transparent overlay:

### Navy Blue Overlay (Recommended)
```css
background: linear-gradient(rgba(0, 0, 51, 0.85), rgba(0, 0, 51, 0.85)), 
            url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png');
```

### Red Overlay (Alternative)
```css
background: linear-gradient(rgba(193, 70, 68, 0.85), rgba(193, 70, 68, 0.85)), 
            url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png');
```

### Dark Gradient (For maximum text readability)
```css
background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 51, 0.9)), 
            url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png');
```

---

## 🖼️ Layout Combinations

### Combo 1: Hero with Portrait + Flag Background
**Best for:** Launch article, major announcements

```html
<div style="background: linear-gradient(rgba(0, 0, 51, 0.75), rgba(0, 0, 51, 0.75)), 
                        url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png'); 
            background-size: cover; 
            padding: 40px 20px; 
            text-align: center;">
    
    <img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/bongiman4sml.png" 
         alt="Jeffrey Buongiorno" 
         style="max-width: 300px; height: auto; margin-bottom: 20px;">
    
    <h1 style="color: white; font-size: 36px; font-weight: 900;">
        Why I'm Running for Congress
    </h1>
</div>
```

---

### Combo 2: White Logo on Navy Background
**Best for:** Professional email header

```html
<div style="background: #000033; padding: 30px 20px; text-align: center;">
    <img src="https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png" 
         alt="Jeff Buongiorno for Congress" 
         style="max-width: 300px; height: auto;">
</div>
```

---

### Combo 3: Color Logo on White with Flag Accent
**Best for:** Article headers, email tops

```html
<div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 6px solid #C14644;">
    <img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png" 
         alt="Jeff Buongiorno for Congress" 
         style="max-width: 300px; height: auto;">
    
    <p style="color: #000033; font-size: 16px; margin-top: 15px;">
        Evidence-Based Transparency | Make Elections Constitutional Again
    </p>
</div>
```

---

## 📐 Responsive Image Sizing

### For Mobile-Friendly Emails:

```html
<!-- Logo -->
<img src="LOGO_URL_HERE" 
     alt="Jeff Buongiorno for Congress" 
     style="max-width: 100%; height: auto; width: 300px;">

<!-- Portrait -->
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/bongiman4sml.png" 
     alt="Jeffrey Buongiorno" 
     style="max-width: 100%; height: auto; width: 350px;">
```

**Why this works:**
- `max-width: 100%` ensures images never overflow on small screens
- `height: auto` maintains aspect ratio
- `width: 300px` sets preferred size on larger screens

---

## 🎯 Social Media Sizing

### Facebook/LinkedIn Share Image
**Optimal Size:** 1200x630px

**Create using:**
- Flag background as base
- Portrait cutout overlaid on left or right
- Campaign slogan in bold text
- Logo in corner

### Twitter/X Share Image
**Optimal Size:** 1200x675px

**Create using:**
- Similar to Facebook, but slightly different ratio
- Keep text large and readable
- Use high contrast (white text on navy/flag background)

### Instagram Post
**Optimal Size:** 1080x1080px (square)

**Create using:**
- Portrait centered
- Flag background
- Campaign slogan above or below

---

## 🚫 What NOT to Do

### Don't:
- ❌ Stretch or distort logos
- ❌ Change logo colors
- ❌ Add effects/filters to official logos
- ❌ Use portrait on cluttered backgrounds (flag background needs overlay)
- ❌ Place text on flag background without overlay (poor readability)
- ❌ Crop logo awkwardly

### Do:
- ✅ Maintain aspect ratios
- ✅ Use appropriate logo version for background color
- ✅ Add semi-transparent overlays to flag background when adding text
- ✅ Keep portrait images unaltered
- ✅ Use consistent sizing across campaign materials

---

## 📥 Downloading Images

All images are hosted on the campaign website. To download for offline use:

1. Right-click on the image URL in your browser
2. Select "Save image as..."
3. Save to organized folder (e.g., "Campaign_Assets/Logos/")

**Recommended folder structure:**
```
Campaign_Assets/
├── Logos/
│   ├── main_logo_color.png
│   └── white_logo.png
├── Photos/
│   └── portrait_transparent.png
└── Backgrounds/
    └── flag_background.png
```

---

## 🔗 Quick Reference Links

| Asset | URL | Best Use |
|-------|-----|----------|
| **Main Logo (Color)** | [Link](https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png) | Light backgrounds |
| **White Logo** | [Link](https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png) | Dark backgrounds |
| **Portrait (Transparent)** | [Link](https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/bongiman4sml.png) | Hero sections, signatures |
| **Flag Background** | [Link](https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png) | Background images |

---

## 📝 Usage Examples in Templates

See the following template files for implementation:
- **hero-with-portrait.html** - Full hero section with portrait and flag
- **email-header-with-logo.html** - Professional header options
- **signature-with-portrait.html** - Article footer with portrait

All templates include the actual image URLs ready to use.

---

**Need custom graphics?** Use these official assets as building blocks. Tools like Canva make it easy to combine the portrait, flag, and text for custom social media posts.

