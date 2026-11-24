<?php
/**
 * Plugin Name: StackCache
 * Plugin URI:  https://cache.stackcp.com/
 * Description: Platform-managed StackCache integration.
 * Author:      Stack CP
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'get_home_path' ) ) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
}

$stackcache_library = '/usr/share/php/wp-stack-cache.php';

if ( ! is_readable( $stackcache_library ) ) {
    error_log( 'StackCache library is missing or unreadable.' );
    return;
}

require_once $stackcache_library;

if ( ! class_exists( 'WPStackCache', false ) ) {
    error_log( 'StackCache library did not define WPStackCache.' );
    return;
}

new WPStackCache();
