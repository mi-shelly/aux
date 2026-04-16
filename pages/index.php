<?php

declare(strict_types=1);

$package = rex_addon::get('aux');
echo rex_view::title($package->i18n('aux_title'));
rex_be_controller::includeCurrentPageSubPath();
