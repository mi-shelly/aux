<?php

declare(strict_types=1);

$addon = rex_addon::get('aux');

// Copy assets to public directory
$src = $addon->getPath('assets/');
$dst = $addon->getAssetsPath();

rex_dir::copy($src, $dst);
