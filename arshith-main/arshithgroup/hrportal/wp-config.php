<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'wordpress-393567de');

/** MySQL database username */
define('DB_USER', 'wordpress-393567de');

/** MySQL database password */
define('DB_PASSWORD', 'd5d3fe3c777c');

/** MySQL hostname */
define('DB_HOST', 'shareddb-j.hosting.stackcp.net');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'onJkvbFjNCVSRjgSU7uE/4pu+wkQt0Gn');
define('SECURE_AUTH_KEY',  'ah+A1oXmL881qtEwpRq6N7ce+aMa/j/Z');
define('LOGGED_IN_KEY',    'EsJX6ZZnMifRer5vzUBMugcpgwCxTx8b');
define('NONCE_KEY',        '1Ai72ki7JZOK18HodGd83H0XgNsBL8ds');
define('AUTH_SALT',        'EGEYYSbHIWz0MnLn/2nqzL3pqI/Ms4bk');
define('SECURE_AUTH_SALT', 'i9551TGCtYOQQHdALkq+0XM7ss5v/Rav');
define('LOGGED_IN_SALT',   'kQtZCISReX/DLPqapnYiZ4xgl6WMEvbe');
define('NONCE_SALT',       'wgJw8feyq5yK63XlNAI60ZEE772aAnbZ');
/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'af_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

define( 'FS_METHOD', 'direct' );
/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
