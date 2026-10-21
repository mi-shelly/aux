<?php

declare(strict_types=1);

namespace FriendsOfRedaxo\Aux;

use rex_addon;
use rex_clang;

class Aux
{
    /**
     * OUTPUT_FILTER Extension Point Callback.
     * Injects the aux accessibility widget into the frontend.
     *
     * @param \rex_extension_point<string> $ep
     */
    public static function inject(\rex_extension_point $ep): string
    {
        $content = $ep->getSubject();
        $addon = rex_addon::get('aux');

        // Only inject if there's an HTML body
        if (stripos($content, '</body>') === false) {
            return $content;
        }

        $position = (string) $addon->getConfig('position', 'bottom-right');
        $buttonColor = (string) $addon->getConfig('button_color', '#1a73e8');
        $offsetX = (int) $addon->getConfig('offset_x', 20);
        $offsetY = (int) $addon->getConfig('offset_y', 50);

        $lang = self::detectLanguage();

        // Build asset URLs
        $assetsUrl = $addon->getAssetsUrl();
        $cssAdjustments = $assetsUrl . 'css/aux-adjustments.css?v=' . self::assetVersion('css/aux-adjustments.css');
        $jsWidget = $assetsUrl . 'js/aux-widget.js?v=' . self::assetVersion('js/aux-widget.js');

        // The widget stylesheet is loaded by the script into the widget's shadow root,
        // so site CSS cannot restyle the widget (and vice versa).
        // Config is a JSON data block: not executed, so it also works under a strict CSP.
        $config = json_encode([
            'position' => $position,
            'buttonColor' => $buttonColor,
            'offsetX' => $offsetX,
            'offsetY' => $offsetY,
            'assetsUrl' => $assetsUrl,
            'cssUrl' => $assetsUrl . 'css/aux-widget.css?v=' . self::assetVersion('css/aux-widget.css'),
            'lang' => $lang,
            'i18n' => self::getTranslations($lang),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);

        $injection = <<<HTML

<!-- Aux Accessibility Widget -->
<link rel="stylesheet" href="{$cssAdjustments}" />
<script type="application/json" id="aux-config">{$config}</script>
<script src="{$jsWidget}" defer></script>
<!-- /Aux Accessibility Widget -->

HTML;

        // Insert before the LAST </body> (case-insensitive): an earlier one may sit in a
        // script string or an iframe srcdoc.
        $pos = strripos($content, '</body>');
        if (false === $pos) {
            return $content;
        }

        return substr_replace($content, $injection . '</body>', $pos, strlen('</body>'));
    }

    /**
     * Widget language from the clang code: German and English are translated,
     * other well-known languages get English, unknown codes keep the previous
     * default (German).
     */
    private static function detectLanguage(): string
    {
        $code = strtolower(rex_clang::getCurrent()->getCode());

        if (in_array($code, ['de', 'en'], true)) {
            return $code;
        }

        return in_array($code, ['es', 'fr', 'it', 'nl', 'pt', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'tr', 'ru', 'ja', 'zh'], true) ? 'en' : 'de';
    }

    /**
     * WCAG contrast ratio between two #rrggbb colours (1 to 21).
     */
    public static function contrastRatio(string $hexA, string $hexB): float
    {
        $luminance = static function (string $hex): float {
            $channels = array_map(
                static function (string $c): float {
                    $v = hexdec($c) / 255;
                    return $v <= 0.03928 ? $v / 12.92 : (($v + 0.055) / 1.055) ** 2.4;
                },
                str_split(ltrim($hex, '#'), 2),
            );
            return 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
        };
        $a = $luminance($hexA);
        $b = $luminance($hexB);

        return (max($a, $b) + 0.05) / (min($a, $b) + 0.05);
    }

    /**
     * Cache-buster: file mtime, so changed assets are never served stale.
     */
    private static function assetVersion(string $file): int
    {
        return (int) @filemtime(rex_addon::get('aux')->getAssetsPath($file));
    }

    /**
     * Get translations for the widget frontend.
     *
     * @return array<string, string>
     */
    private static function getTranslations(string $lang): array
    {
        $translations = [
            'de' => [
                'title' => 'Barrierefreiheit',
                'close' => 'Schließen',
                'profiles' => 'Profile',
                'profile_vision' => 'Sehbehinderung',
                'profile_dyslexia' => 'Dyslexie',
                'profile_adhd' => 'ADHS',
                'profile_motor' => 'Motorik',
                'profile_cognitive' => 'Kognitiv',
                'profile_seizure' => 'Epilepsie',
                'display' => 'Darstellung',
                'contrast' => 'Kontrast',
                'contrast_normal' => 'Normal',
                'contrast_dark' => 'Dunkel',
                'contrast_light' => 'Hell',
                'contrast_high' => 'Hoher Kontrast',
                'contrast_inverted' => 'Invertiert',
                'grayscale' => 'Graustufen',
                'brightness' => 'Helligkeit',
                'decrease' => 'verringern',
                'increase' => 'erhöhen',
                'text_size' => 'Textgröße',
                'line_height' => 'Zeilenabstand',
                'letter_spacing' => 'Buchstabenabstand',
                'text_align' => 'Textausrichtung',
                'align_none' => 'Standard',
                'align_left' => 'Links',
                'align_center' => 'Zentriert',
                'align_right' => 'Rechts',
                'reading_aids' => 'Lesehilfen',
                'highlight_links' => 'Links hervorheben',
                'highlight_headings' => 'Überschriften markieren',
                'reading_ruler' => 'Lese-Lineal',
                'reading_mask' => 'Lesemaske',
                'tts_active' => 'Textleser aktiv: Ein Klick auf Text liest ihn vor, Links sind vorübergehend nicht anklickbar.',
                'tts_stop' => 'Beenden',
                'dyslexia_font' => 'Dyslexie-Schrift',
                'focus_highlight' => 'Focus-Hervorhebung',
                'other' => 'Sonstiges',
                'big_cursor' => 'Cursor vergrößern',
                'stop_animations' => 'Animationen stoppen',
                'hide_images' => 'Bilder ausblenden',
                'text_reader' => 'Textleser (Vorlesen)',
                'reset' => 'Zurücksetzen',
                'widget_position' => 'Widget-Position',
                'widget_left' => 'Links',
                'widget_right' => 'Rechts',
                'widget_hide' => 'Ausblenden',
                'widget_hidden_hint' => 'Widget ausgeblendet. Drücke Strg+Alt+A (Windows) oder ⌘+⌥+A (Mac) um es wieder einzublenden.',
            ],
            'en' => [
                'title' => 'Accessibility',
                'close' => 'Close',
                'profiles' => 'Profiles',
                'profile_vision' => 'Visual Impairment',
                'profile_dyslexia' => 'Dyslexia',
                'profile_adhd' => 'ADHD',
                'profile_motor' => 'Motor',
                'profile_cognitive' => 'Cognitive',
                'profile_seizure' => 'Epilepsy',
                'display' => 'Display',
                'contrast' => 'Contrast',
                'contrast_normal' => 'Normal',
                'contrast_dark' => 'Dark',
                'contrast_light' => 'Light',
                'contrast_high' => 'High Contrast',
                'contrast_inverted' => 'Inverted',
                'grayscale' => 'Grayscale',
                'brightness' => 'Brightness',
                'decrease' => 'decrease',
                'increase' => 'increase',
                'text_size' => 'Text Size',
                'line_height' => 'Line Height',
                'letter_spacing' => 'Letter Spacing',
                'text_align' => 'Text Alignment',
                'align_none' => 'Default',
                'align_left' => 'Left',
                'align_center' => 'Center',
                'align_right' => 'Right',
                'reading_aids' => 'Reading Aids',
                'highlight_links' => 'Highlight Links',
                'highlight_headings' => 'Highlight Headings',
                'reading_ruler' => 'Reading Ruler',
                'reading_mask' => 'Reading Mask',
                'tts_active' => 'Text reader on: click text to hear it read aloud. Links are temporarily not clickable.',
                'tts_stop' => 'Stop',
                'dyslexia_font' => 'Dyslexia Font',
                'focus_highlight' => 'Focus Highlight',
                'other' => 'Other',
                'big_cursor' => 'Large Cursor',
                'stop_animations' => 'Stop Animations',
                'hide_images' => 'Hide Images',
                'text_reader' => 'Text Reader (Read Aloud)',
                'reset' => 'Reset',
                'widget_position' => 'Widget Position',
                'widget_left' => 'Left',
                'widget_right' => 'Right',
                'widget_hide' => 'Hide',
                'widget_hidden_hint' => 'Widget hidden. Press Ctrl+Alt+A (Windows) or ⌘+⌥+A (Mac) to show it again.',
            ],
        ];

        return $translations[$lang] ?? $translations['de'];
    }
}
