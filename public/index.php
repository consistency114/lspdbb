<?php
session_start();
require __DIR__ . '/../includes/config.php';

// Only these URL prefixes remain public
$publicPrefixes = [
  '/login',
  '/logout',
  '/setup',
  '/assets/',
  '/includes/',
  '/cdn/serve.php',
];

// Figure out the request path (no query string)
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$isPublic = false;
foreach ($publicPrefixes as $prefix) {
  if (strpos($requestPath, $prefix) === 0) {
    $isPublic = true;
    break;
  }
}

// If auth is enabled, and this URL is *not* in the public list, enforce login
if (ENABLE_AUTH && ! $isPublic && empty($_SESSION['user'])) {
  header('Location: /login');
  exit;
}


$isWhitelisted = false;
foreach ($whitelist as $path) {
  if (strpos($requestPath, $path) === 0) {
    $isWhitelisted = true;
    break;
  }
}

if (ENABLE_AUTH && ! $isWhitelisted) {
  if (empty($_SESSION['user'])) {
    // Not logged in, redirect to the login form
    header('Location: /login');
    exit;
  }
}

// From here on you’re either on a whitelisted URL
// or you have a valid $_SESSION['user'], so render normally…


/**
 * reBB - Main Entry Point
 *
 * This file serves as the single entry point for the application.
 * It loads the kernel and initializes the routing system.
 */

// Define the base path for the application
// In this case, the base directory will be the public folder
define('PUBLIC_DIR', __DIR__);

// Define the root directory (parent of public)
define('ROOT_DIR', dirname(__DIR__));

// Include the kernel
require_once ROOT_DIR . '/kernel.php';

// Access the router instance that should be created by autorun.php
global $router;

// Process the current request if the router is available
if (isset($router) && $router instanceof Router) {
    $router->processRequest();
} else {
    // If the router is not available, display an error
    echo "Error: Router not initialized. Please check your installation.";
}