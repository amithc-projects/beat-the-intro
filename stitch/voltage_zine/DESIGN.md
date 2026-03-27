# Design System Strategy: The High-Voltage Underground

## 1. Overview & Creative North Star
This design system is built to dismantle the polished, "polite" aesthetic of modern streaming services. Our Creative North Star is **"The High-Voltage Underground"**—a digital manifestation of DIY zine culture collided with high-end technical precision. 

To "Beat the Intro," the UI must feel kinetic, visceral, and raw. We move beyond the "template" look by utilizing intentional asymmetry, overlapping elements that break the container, and a typography scale that favors impact over safety. This is not a service; it is a broadcast. We replace "user-friendly" softness with "user-challenging" energy, rewarding the fast-paced player with a UI that moves as quickly as the music.

## 2. Colors & Surface Philosophy
The palette is a high-octane trio of absolute black, stark white, and the signature 'Volt' (#D1FF00). 

### The "Impact Stroke" Rule
In this design system, we prohibit 1px subtle borders. Boundaries must be defined through high-contrast background shifts or **"Impact Strokes"**—2px to 4px solid lines using `outline` or `primary_container` (Volt). If a section doesn't require high-impact definition, use a background shift from `surface` to `surface_container_low`.

### Surface Hierarchy & Nesting
We treat the UI as a series of stacked, physical sheets of paper and technical displays.
- **Base Layer:** `surface` (#131313) acts as the dark "basement" of the application.
- **Nesting:** To create depth without using shadows, place `surface_container_high` elements directly onto `surface`. This creates a "lifted" feel through pure tonal contrast.
- **The "Volt" Surge:** Use `primary_container` (#c7f300) for interactive zones that need to "scream." This color is our electricity; use it for active states and critical paths.

### Signature Textures & Glass
To avoid a flat, "dead" look, incorporate high-grain "static" overlays on `surface_variant` sections. Use Glassmorphism (backdrop-blur) specifically for floating "HUD" (Heads-Up Display) elements, using a semi-transparent `surface_container_highest` to create a "dirty acrylic" effect.

## 3. Typography: Technical Visceralism
We use **Space Grotesk** across the entire system. Its blend of geometric technicality and quirky, monospaced-adjacent letterforms provides a "human-made machine" feel.

- **Display (LG/MD):** These are your "headlines in a riot." Use negative letter-spacing (-2%) and all-caps for maximum aggression. These should often overlap other elements to break the grid.
- **Headline/Title:** Technical and clear. Use these for song titles and artist names to ensure legibility amidst the chaos.
- **Label (MD/SM):** Our "Metadata" layer. These should feel like technical specs on a circuit board. Use high tracking (+5%) to mimic monospaced data readouts.

## 4. Elevation & Depth: Tonal Stacking
Traditional Material Design shadows have no place here. We communicate hierarchy through **Hard Layering**.

- **The Layering Principle:** Depth is achieved by stacking sharp-edged containers. A `surface_container_lowest` card sitting on a `surface_bright` background creates a "punched-out" effect.
- **The "Offset" Shadow:** When a floating effect is required (e.g., a primary button), do not use a blur. Use a hard, 100% opaque offset "shadow" in `primary_container` (Volt) or `primary` (White) to mimic a printing misalignment in a zine.
- **Ghost Borders:** For non-critical containment, use the `outline_variant` at 20% opacity. It should feel like a "hint" of a box rather than a structural container.

## 5. Components

### Buttons: The Kinetic Trigger
- **Primary:** Sharp 0px corners. Solid `primary_container` (Volt) fill with `on_primary_container` (Black) text. 
- **States:** On hover, the button should "glitch" or offset its position by 2px.
- **Tertiary:** No fill. Heavy 2px border in `primary`.

### Input Fields: Technical Entry
- **Styling:** `surface_container_high` background with a heavy bottom-stroke in `primary`.
- **Focus:** When focused, the bottom stroke turns into a full 2px box in `primary_container`. Text should use `label-md` for the floating label to maintain the technical readout aesthetic.

### Cards & Lists: The No-Divider Rule
- **Cards:** Forbid the use of standard horizontal dividers. Separate list items using a 0.6rem (`spacing-3`) vertical gap and alternating background colors between `surface_container_low` and `surface_container_highest`.
- **Layout:** Use "Zine-style" asymmetry. Images within cards should be slightly tilted (1-2 degrees) or offset from their container to create a sense of motion.

### The "Pulse" Progress Bar
- **Styling:** A thick, 8px bar using `surface_container_highest` as the track and `primary_container` (Volt) as the indicator. No rounded caps; the ends must be perfectly square.

## 6. Do's and Don'ts

### Do:
- **Overlap Elements:** Let typography bleed over images and containers to create a "pasted-on" feel.
- **Use 0px Radii:** Every corner in the system must be a sharp 90-degree angle.
- **Embrace White Space:** Use the Spacing Scale (specifically `spacing-16` and `20`) to create "breathing rooms" of pure black between high-energy content blocks.

### Don't:
- **No Soft Gradients:** If a gradient is used, it should be a "dithered" or high-contrast transition. Never use soft, "SaaS-style" atmospheric gradients.
- **No 1px Gray Lines:** If a line is worth drawing, it’s worth making it heavy or colored.
- **No "Safe" Centering:** Avoid perfectly centered layouts. Lean into left-aligned "brutal" stacks or right-aligned metadata columns to keep the user’s eye moving.

### Accessibility Note
While we lean into high contrast, ensure that all `on_surface` and `on_primary` text maintains a 4.5:1 ratio. The use of 'Volt' (#D1FF00) as a background requires pure black text (`on_primary_container`) to ensure maximum readability during high-speed gameplay.