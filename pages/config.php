<?php

declare(strict_types=1);

$addon = rex_addon::get('aux');

// Handle form submission
if (rex_post('config-submit', 'string') !== '') {
    $addon->setConfig('active', rex_post('active', 'string', 'true'));
    $addon->setConfig('position', rex_post('position', 'string', 'bottom-right'));
    $rawColor = rex_post('button_color', 'string', '#1a73e8');
    $addon->setConfig('button_color', preg_match('/^#[0-9A-Fa-f]{6}$/', $rawColor) ? $rawColor : '#1a73e8');
    $addon->setConfig('offset_x', max(0, (int) rex_post('offset_x', 'int', 20)));
    $addon->setConfig('offset_y', max(0, (int) rex_post('offset_y', 'int', 50)));

    echo rex_view::success($addon->i18n('aux_config_saved'));
}

// Get current values
$active = $addon->getConfig('active', 'true');
$position = $addon->getConfig('position', 'bottom-right');
$buttonColor = $addon->getConfig('button_color', '#1a73e8');
$offsetX = (int) $addon->getConfig('offset_x', 20);
$offsetY = (int) $addon->getConfig('offset_y', 50);

// Build form
$content = '';

// Active toggle
$formElements = [];
$n = [];
$n['label'] = '<label for="aux-active">' . $addon->i18n('aux_active') . '</label>';
$select = new rex_select();
$select->setId('aux-active');
$select->setName('active');
$select->setAttribute('class', 'form-control');
$select->addOption($addon->i18n('aux_yes'), 'true');
$select->addOption($addon->i18n('aux_no'), 'false');
$select->setSelected($active);
$n['field'] = $select->get();
$formElements[] = $n;

// Position
$n = [];
$n['label'] = '<label for="aux-position">' . $addon->i18n('aux_position') . '</label>';
$select = new rex_select();
$select->setId('aux-position');
$select->setName('position');
$select->setAttribute('class', 'form-control');
$select->addOption($addon->i18n('aux_position_bottom_right'), 'bottom-right');
$select->addOption($addon->i18n('aux_position_bottom_left'), 'bottom-left');
$select->addOption($addon->i18n('aux_position_top_right'), 'top-right');
$select->addOption($addon->i18n('aux_position_top_left'), 'top-left');
$select->setSelected($position);
$n['field'] = $select->get();
$formElements[] = $n;

// Offset X (horizontal, px from side)
$n = [];
$n['label'] = '<label for="aux-offset-x">' . $addon->i18n('aux_offset_x') . '</label>';
$n['field'] = '<input class="form-control" type="number" min="0" step="1" id="aux-offset-x" name="offset_x" value="' . rex_escape((string) $offsetX) . '" />'
    . '<p class="help-block small">' . $addon->i18n('aux_offset_x_help') . '</p>';
$formElements[] = $n;

// Offset Y (vertical, px from edge)
$n = [];
$n['label'] = '<label for="aux-offset-y">' . $addon->i18n('aux_offset_y') . '</label>';
$n['field'] = '<input class="form-control" type="number" min="0" step="1" id="aux-offset-y" name="offset_y" value="' . rex_escape((string) $offsetY) . '" />'
    . '<p class="help-block small">' . $addon->i18n('aux_offset_y_help') . '</p>';
$formElements[] = $n;

// Button color
$n = [];
$n['label'] = '<label for="aux-button-color-text">' . $addon->i18n('aux_button_color') . '</label>';
$n['field'] = '
<div style="display:flex; align-items:center; gap:10px;">
    <div id="aux-color-swatch"
         title="Farbe wählen"
         style="width:38px; height:38px; border-radius:6px; border:1px solid #ccc; background:' . rex_escape($buttonColor) . '; cursor:pointer; flex-shrink:0;"
         onclick="document.getElementById(\'aux-button-color\').click()">
    </div>
    <input class="form-control"
           type="text"
           id="aux-button-color-text"
           placeholder="#1a73e8"
           maxlength="7"
           value="' . rex_escape($buttonColor) . '"
           style="width:120px; font-family:monospace;"
           oninput="auxSyncColor(this.value)" />
    <input type="color"
           id="aux-button-color"
           name="button_color"
           value="' . rex_escape($buttonColor) . '"
           style="position:absolute; opacity:0; width:0; height:0; pointer-events:none;"
           oninput="auxSyncFromPicker(this.value)" />
</div>
<script>
function auxSyncColor(hex) {
    var valid = /^#[0-9A-Fa-f]{6}$/.test(hex);
    var swatch = document.getElementById("aux-color-swatch");
    var picker = document.getElementById("aux-button-color");
    if (valid) {
        swatch.style.background = hex;
        picker.value = hex;
        swatch.style.borderColor = "#ccc";
    } else {
        swatch.style.borderColor = "#e74c3c";
    }
}
function auxSyncFromPicker(hex) {
    document.getElementById("aux-button-color-text").value = hex;
    document.getElementById("aux-color-swatch").style.background = hex;
    document.getElementById("aux-button-color-text").style.borderColor = "";
}
// Ensure the hidden input carries the HEX value on submit
document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("aux-button-color").closest("form");
    if (form) {
        form.addEventListener("submit", function() {
            var txt = document.getElementById("aux-button-color-text").value;
            if (/^#[0-9A-Fa-f]{6}$/.test(txt)) {
                document.getElementById("aux-button-color").value = txt;
            }
        });
    }
});
</script>
';
$formElements[] = $n;

$fragment = new rex_fragment();
$fragment->setVar('elements', $formElements, false);
$content .= $fragment->parse('core/form/form.php');

// Submit button
$formElements = [];
$n = [];
$n['field'] = '<button class="btn btn-save rex-form-aligned" type="submit" name="config-submit" value="1">' . $addon->i18n('aux_save') . '</button>';
$formElements[] = $n;

$fragment = new rex_fragment();
$fragment->setVar('elements', $formElements, false);
$buttons = $fragment->parse('core/form/submit.php');

// Wrap in section
$fragment = new rex_fragment();
$fragment->setVar('class', 'edit', false);
$fragment->setVar('title', $addon->i18n('aux_config'), false);
$fragment->setVar('body', $content, false);
$fragment->setVar('buttons', $buttons, false);
$content = $fragment->parse('core/page/section.php');

echo '<form action="' . rex_url::currentBackendPage() . '" method="post">' . $content . '</form>';
