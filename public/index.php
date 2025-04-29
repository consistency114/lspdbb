<?php
session_start();
// to this (correct):
require __DIR__ . '/../includes/config.php';

// Grab just the path (no query string)
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// List of public endpoints that never require login
$whitelist = [
  '/login',
  '/setup',
  '/includes',
  '/assets',    // if you serve CSS/JS/images here
  '/cdn/serve.php',  // if you load JSON schemas
  // add any other static‐only paths you need
];

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