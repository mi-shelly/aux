<?php

declare(strict_types=1);

$addon = rex_addon::get('aux');

// Handle form submission
if (rex_post('config-submit', 'string') !== '') {
    $addon->setConfig('active', rex_post('active', 'string', 'true'));
    $addon->setConfig('position', rex_post('position', 'string', 'bottom-right'));
    $addon->setConfig('button_color', rex_post('button_color', 'string', '#1a73e8'));

    echo rex_view::success($addon->i18n('aux_config_saved'));
}

// Get current values
$active = $addon->getConfig('active', 'true');
$position = $addon->getConfig('position', 'bottom-right');
$buttonColor = $addon->getConfig('button_color', '#1a73e8');

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

// Button color
$n = [];
$n['label'] = '<label for="aux-button-color">' . $addon->i18n('aux_button_color') . '</label>';
$n['field'] = '<input class="form-control" type="color" id="aux-button-color" name="button_color" value="' . rex_escape($buttonColor) . '" />';
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
