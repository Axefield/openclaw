# HTML Templates for Jeffrey Buongiorno Substack

**Professional, branded email templates matching the campaign's visual identity**

---

## 🎨 Brand Guidelines

### Official Colors
- **Navy Blue:** `#000033` (primary dark)
- **Campaign Red:** `#C14644` (primary accent)
- **White:** `#ffffff` (text on dark backgrounds)
- **Gray Text:** `#666666` (secondary text)
- **Light Background:** `#f8f9fa` (cards/sections)

### Official Logos

#### Main Logo (Red/Blue on White)
```
https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png
```
**Use for:** Light backgrounds, article headers, email headers

#### White Logo (for Dark Backgrounds)
```
https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png
```
**Use for:** Navy blue backgrounds, footer sections, hero images

### Campaign Slogan
**"MAKE ELECTIONS CONSTITUTIONAL AGAIN"**

---

## 📁 Available Templates

### 1. **header-template.html**
Professional header with logo, campaign slogan, and subtitle

**Features:**
- Navy blue gradient background
- Bold logo treatment
- Red banner with slogan
- Responsive design

**Use for:** Top of every email/article

---

### 2. **article-hero-section.html**
Eye-catching hero section for article introductions

**Features:**
- Background image overlay capability
- Category badge (Evidence Drop, Strategy Brief, etc.)
- Large headline treatment
- Article metadata (author, date, read time)

**Use for:** Opening section of feature articles

**Customization:**
- Replace `YOUR_IMAGE_URL_HERE` with actual background image
- Update category badge text and emoji
- Modify title and subtitle
- Update metadata

---

### 3. **evidence-card.html**
Specialized card for displaying court documents and evidence

**Features:**
- Document icon and header
- Quoted text preview
- "What This Means" plain-English translation
- Download/view buttons

**Use for:** Evidence Drops, court document presentations

**Customization:**
- Update document title and filing details
- Add actual document quotes
- Write plain-English explanation
- Insert document links

---

### 4. **four-pillars-section.html**
Visual presentation of campaign's core positioning

**Features:**
- Four color-coded cards
- Alternating navy/red backgrounds
- Icon integration
- Clear pillar descriptions

**Use for:** Launch article, about sections, campaign overviews

**The Four Pillars:**
1. 👁️ Transparent Governance
2. 🗳️ Electoral Integrity
3. 📜 Constitutional Fidelity
4. ⚖️ Anti-Establishment Reform

---

### 5. **donation-cta-section.html**
Comprehensive donation call-to-action with multiple tiers

**Features:**
- Three-tier donation structure
- Visual hierarchy (Core Team highlighted)
- FEC compliance disclaimer
- Clear button CTAs

**Use for:** End of articles, dedicated fundraising emails

**Donation Tiers:**
- 🎯 Core Team: $50/month or $500/year
- 💪 Monthly Support: $5-$25/month
- 🔥 One-Time: Any amount

**Customization:**
- Update all `YOUR_*_LINK_HERE` placeholders with real donation URLs

---

### 6. **stats-dashboard.html**
Transparent financial and campaign metrics display

**Features:**
- Four stat cards (raised, donors, total, average)
- Detailed spending breakdown table
- Cash on hand banner
- Color-coded categories

**Use for:** Weekly Recap articles, transparency reports

**Customization:**
- Update all financial figures with real data
- Modify spending categories as needed
- Add/remove stat cards

---

### 7. **quote-highlight.html**
Three styles of pull quotes for emphasis

**Features:**
- Large impact quote (navy background)
- Alternative red background quote
- Simple inline quote

**Use for:** Highlighting key statements, breaking up long articles

**Customization:**
- Replace quote text
- Update attribution
- Choose appropriate background style

---

### 8. **footer-signature.html**
Professional article closer with signature and CTAs

**Features:**
- Author signature and title
- Subscribe and donate buttons
- Social media links
- Engagement prompt
- P.S. teaser for next article

**Use for:** Bottom of every article

**Customization:**
- Update all links (Substack, donation, social media)
- Modify P.S. teaser for upcoming content
- Add/remove social media links

---

## 🖼️ Image Assets

### Logo Files

#### Primary Logo (Color)
**URL:** `https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png`

**Specs:**
- Format: PNG with transparency
- Usage: White or light backgrounds
- Colors: Red (#C14644) and Navy Blue (#000033)

#### White Logo
**URL:** `https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png`

**Specs:**
- Format: PNG with transparency
- Usage: Dark backgrounds (navy, red)
- Color: White (#FFFFFF)

### Where to Find More Images

**Campaign Website:**
```
https://www.jeffbuongiorno.com/
```

**Potential Image Locations:**
- Professional headshots
- Event photos
- Document scans
- Graphics and banners

**Recommended Image Sizes:**
- **Header backgrounds:** 1200x400px minimum
- **Article heroes:** 1200x600px minimum
- **Social sharing:** 1200x630px (Facebook/Twitter optimal)
- **Logo usage:** Use original files, don't resize

---

## 🔧 How to Use These Templates

### Step 1: Choose Your Templates
Pick the sections you need for your article:
- Header (always)
- Hero section (optional, for feature articles)
- Body content (your text)
- Evidence cards (for Evidence Drops)
- Four Pillars (for positioning articles)
- Donation CTA (recommended for most articles)
- Footer (always)

### Step 2: Copy the HTML
Open the template file and copy everything between the comments:
```html
<!-- TEMPLATE NAME - Copy everything inside this comment block -->
...
<!-- END TEMPLATE NAME -->
```

### Step 3: Customize
Replace all placeholder content:
- `YOUR_IMAGE_URL_HERE` → actual image URLs
- `YOUR_*_LINK_HERE` → real links
- Sample text → your actual content
- Sample numbers → real data

### Step 4: Paste into Substack

**For Substack:**
1. Create new post
2. Click the `</>` icon to switch to HTML mode
3. Paste your customized HTML
4. Preview to verify
5. Publish

**Note:** Substack has its own email renderer. Always preview before sending to ensure formatting is correct.

---

## 📝 Complete Example Article

See **complete-article-example.html** for a full article that combines multiple templates into one cohesive piece.

---

## 🎯 Design Principles

### 1. **Mobile-First**
All templates use responsive design:
- `max-width: 680px` for readability on all devices
- Flexible layouts that adapt to screen size
- Large touch-friendly buttons

### 2. **Brand Consistency**
Every template uses official:
- Campaign colors
- Typography (system fonts for reliability)
- Logo placement
- Slogan integration

### 3. **Accessibility**
- High contrast text (WCAG AA compliant)
- Clear visual hierarchy
- Large, readable fonts
- Descriptive link text

### 4. **Email-Safe**
- Inline CSS (required for email clients)
- No external stylesheets
- Widely supported HTML/CSS only
- Tested across major email clients

---

## ⚠️ Common Issues and Fixes

### Issue: Images Not Showing
**Problem:** Using local file paths instead of URLs

**Fix:** Always use full URLs starting with `https://`
```html
<!-- BAD -->
<img src="logo.png">

<!-- GOOD -->
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png">
```

### Issue: Formatting Breaks in Email
**Problem:** Email clients strip certain CSS

**Fix:** These templates use email-safe inline styles. If you add custom CSS:
- Always use inline styles (`style="..."`)
- Avoid `class` and external CSS
- Stick to basic properties (color, padding, margin, font)

### Issue: Buttons Not Clickable
**Problem:** Forgot to update placeholder links

**Fix:** Replace ALL `YOUR_*_LINK_HERE` with real URLs:
```html
<!-- BAD -->
<a href="YOUR_DONATION_LINK_HERE">DONATE</a>

<!-- GOOD -->
<a href="https://secure.winred.com/buongiorno-for-congress">DONATE</a>
```

### Issue: Broken Layout on Mobile
**Problem:** Added fixed widths

**Fix:** Use `max-width` instead of `width` for containers:
```html
<!-- BAD -->
<div style="width: 800px;">

<!-- GOOD -->
<div style="max-width: 680px; margin: 0 auto;">
```

---

## 🧪 Testing Checklist

Before sending any email:

### Content
- [ ] All placeholder text replaced
- [ ] All `YOUR_*_LINK_HERE` updated with real URLs
- [ ] Images loading correctly
- [ ] Numbers/stats are accurate
- [ ] No typos or grammar errors

### Links
- [ ] Donation links work
- [ ] Social media links correct
- [ ] Document links accessible
- [ ] Subscribe links functional

### Visual
- [ ] Preview on desktop
- [ ] Preview on mobile
- [ ] Check in Substack preview mode
- [ ] Send test email to yourself
- [ ] Verify in Gmail, Outlook, Apple Mail

### Legal
- [ ] FEC disclaimer present (if fundraising content)
- [ ] No defamatory statements
- [ ] Documents properly sourced
- [ ] Compliance review complete

---

## 💡 Pro Tips

### Tip 1: Batch Your Work
Don't design every email from scratch. Create a few standard layouts:
- **Layout A:** Header + Article + Donation + Footer (standard article)
- **Layout B:** Header + Hero + Evidence Cards + Footer (Evidence Drop)
- **Layout C:** Header + Stats Dashboard + Footer (Weekly Recap)

Save these as templates and just update the content each time.

### Tip 2: Reuse Successful Elements
When something works (high click-through, lots of shares):
- Save that section
- Use it in future emails
- Refine and improve

### Tip 3: A/B Test CTAs
Try different:
- Button colors (red vs. navy)
- Button text ("Donate Now" vs. "Support This Campaign")
- Placement (top vs. bottom vs. both)

Track which performs better.

### Tip 4: Keep It Scannable
Use these templates' built-in hierarchy:
- Big headlines
- Short paragraphs (2-4 sentences max)
- Frequent subheadings
- Bullet points
- Visual breaks (cards, quotes, images)

People scan emails—make it easy for them.

### Tip 5: Brand Consistency = Trust
Use the same:
- Colors
- Fonts
- Logo placement
- Tone

Every email should feel like it's from the same campaign.

---

## 📞 Support

### Questions About Templates?
- Review this README first
- Check **complete-article-example.html** for implementation
- Reference original strategy docs in parent folder

### Need Custom Elements?
These templates cover 90% of use cases. For custom needs:
- Start with the closest existing template
- Modify incrementally
- Test thoroughly before using in production

### Technical Issues?
- Substack documentation: https://support.substack.com
- HTML email best practices: https://www.campaignmonitor.com/css/
- Email client compatibility: https://www.caniemail.com/

---

## 📊 Template Performance Tracking

Keep notes on what works:

| Template | Use Case | Avg Open Rate | Avg Click Rate | Notes |
|----------|----------|---------------|----------------|-------|
| Header + Article + CTA | Standard post | _% | _% | Baseline |
| Evidence Card heavy | Evidence Drop | _% | _% | Higher engagement? |
| Stats Dashboard | Weekly Recap | _% | _% | Transparency resonates |
| Donation CTA focused | Fundraising | _% | _% | Track conversion rate |

Update monthly and adjust strategy accordingly.

---

**Remember: These templates are tools. Your content, evidence, and authenticity are what matter most.**

**Make Elections Constitutional Again**

