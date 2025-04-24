<?php
/**
 * lspdbb – Configuration File
 *
 * Core settings for your Render‐hosted lspdbb application.
 */

// ╔════════════════════════════════════════╗
// ║            SITE CONFIGURATION          ║
// ╚════════════════════════════════════════╝

// Site identity
define('SITE_NAME',        'lspdbb');
define('SITE_DESCRIPTION', 'BBCode done differently');

// URLs and paths
define('SITE_URL',         'https://lspdbb.onrender.com');
define('DOCS_URL',         SITE_URL . '/docs');
define('JSON_URL',         SITE_URL . '/cdn/serve.php?file=');
define('ASSETS_DIR',       SITE_URL . '/assets');

// External links
define('FOOTER_GITHUB',    'https://github.com/consistency114/lspdbb');

// ╔════════════════════════════════════════╗
// ║       APPLICATION CONFIGURATION        ║
// ╚════════════════════════════════════════╝

// Environment and debugging
define('ENVIRONMENT',      'production');
define('DEBUG_MODE',       false);

// Session settings
define('SESSION_LIFETIME', 86400);    // 24 hours

// Security and rate limiting
define('MAX_REQUESTS_PER_HOUR', 60);
define('COOLDOWN_PERIOD',        5);
define('IP_BLACKLIST',           ['192.0.2.1']);

// Form size limits
define('MAX_SCHEMA_SIZE_GUEST',  1000000);   // 1 MB
define('MAX_SCHEMA_SIZE_MEMBER', 10000000);  // 10 MB

// Custom link settings
define('DEFAULT_MAX_UNIQUE_LINKS', 5);
define('CUSTOM_LINK_MIN_LENGTH',   3);
define('CUSTOM_LINK_MAX_LENGTH',   30);

// Donations and other site settings
define('ENABLE_AUTH',       true);
define('ENABLE_DONATIONS',  false);
define('ENABLE_JSON_VIEW',  true);

// Footer settings
define('FOOTER_TEXT',       'Made with ❤️ by <a href="https://booskit.dev/" target="_blank">booskit</a>');

// Backward compatibility
define('LEGACY_URLS_ENABLED', true);

// ╔════════════════════════════════════════╗
// ║        NOTIFICATION SETTINGS           ║
// ╚════════════════════════════════════════╝

// Discord webhook for form submission notifications
define('DISCORD_WEBHOOK_URL', '');  // fill in if you want pings

// ╔════════════════════════════════════════╗
// ║         ANALYTICS CONFIGURATION        ║
// ╚════════════════════════════════════════╝

// Master switch for analytics
define('ENABLE_ANALYTICS', true);

// Analytics feature toggles
define('TRACK_VISITORS',   true);
define('TRACK_COMPONENTS', true);
define('TRACK_THEMES',     true);
define('TRACK_FORM_USAGE', true);

// ──────────────────────────────────────────
// End of configuration