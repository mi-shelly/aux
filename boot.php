<?php

declare(strict_types=1);

if (rex::isFrontend()) {
    $addon = rex_addon::get('aux');
    if ('true' === $addon->getConfig('active')) {
        rex_extension::register('OUTPUT_FILTER', [FriendsOfRedaxo\Aux\Aux::class, 'inject']);
    }
}
