<?php
/* ------------------------------------------------------------------ */
/*  Silent-SSO from main phpBB forum  (put this just after common.php)*/
/* ------------------------------------------------------------------ */

const PHPBB_CONFIG = '/absolute/path/to/phpbb/config.php';  // << adjust
const GROUP_ALLOW  = [8, 9, 10, 11, 12];                   // ⇦ ids allowed
const MAX_SESSION_AGE = 900;   // 15 min

if (isset($_GET['sid']) && preg_match('/^[a-f0-9]{32}$/', $_GET['sid'])) {
    $sid  = $_GET['sid'];
    $goto = isset($_GET['goto']) ? $_GET['goto'] : site_url('profile');

    /* --- boot phpBB just enough to get $db and $table_prefix --------- */
    require_once PHPBB_CONFIG;             // gives $dbhost $dbname $dbuser $dbpasswd $table_prefix
    $dsn  = "mysql:host=$dbhost;dbname=$dbname;charset=utf8mb4";
    $pdo  = new PDO($dsn, $dbuser, $dbpasswd, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

    /* 1 ▸ find the session ------------------------------------------- */
    $row = $pdo->prepare("SELECT session_user_id AS uid, session_time
                            FROM {$table_prefix}sessions
                           WHERE session_id = ? LIMIT 1");
    $row->execute([$sid]);
    $row = $row->fetch(PDO::FETCH_ASSOC);

    if ($row &&
        time() - (int)$row['session_time'] <= MAX_SESSION_AGE &&
        ($uid = (int)$row['uid']) > 1) {

        /* 2 ▸ is the user in one of the allowed groups? --------------- */
        $in = str_repeat('?,', count(GROUP_ALLOW) - 1) . '?';
        $st = $pdo->prepare("SELECT 1 FROM {$table_prefix}user_group
                              WHERE user_id = ? AND group_id IN ($in)
                                AND user_pending = 0 LIMIT 1");
        $st->execute(array_merge([$uid], GROUP_ALLOW));

        if ($st->fetchColumn()) {
            /* 3 ▸ we trust the user — create / reuse local account ----- */
            // many apps expose something like forceLogin($externalId)
            // adapt the two calls below to *your* auth layer:

            if (!auth()->userExists("phpbb:$uid")) {
                // pull minimal profile from phpBB or create a stub
                $u = $pdo->prepare("SELECT username, user_email FROM {$table_prefix}users WHERE user_id=?");
                $u->execute([$uid]);
                $info = $u->fetch(PDO::FETCH_ASSOC) ?: ['username'=>"phpbb_$uid", 'user_email'=>''];
                auth()->createUser([
                    'external_id' => "phpbb:$uid",
                    'name'        => $info['username'],
                    'email'       => $info['user_email'],
                ]);
            }
            auth()->forceLogin("phpbb:$uid");   // ← single line log-in

            header("Location: $goto");
            exit;
        }
    }
}/**
 * reBB - Login Page
 * 
 * This file handles user login - no authentication required to access.
 */

// Define the page content to be yielded in the master layout
ob_start();

if(auth()->isLoggedIn()) return redirect('/profile');

// Process login if form submitted
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $csrfToken = $_POST['csrf_token'] ?? '';
    
    // Verify CSRF token
    if (!auth()->verifyCsrfToken($csrfToken)) {
        $error = "Invalid form submission. Please try again.";
    } else {
        // Attempt login
        if (auth()->login($username, $password)) {
            // Check for redirect URL
            $redirect = isset($_SESSION['auth_redirect']) ? $_SESSION['auth_redirect'] : site_url('profile');
            unset($_SESSION['auth_redirect']);
            header("Location: " . $redirect);
            exit;
        } else {
            $error = "Invalid username or password";
        }
    }
}

// Generate CSRF token for form
$csrfToken = auth()->generateCsrfToken();
?>

<div class="container login-page">
    <div class="login-container">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h3 class="mb-0">Login</h3>
            </div>
            <div class="card-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>
                
                <form method="post" action="login">
                    <input type="hidden" name="csrf_token" value="<?php echo $csrfToken; ?>">
                    
                    <div class="form-group mb-3">
                        <label for="username">Username:</label>
                        <input type="text" class="form-control" id="username" name="username" required>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="password">Password:</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>
                    
                    <button type="submit" name="login" class="btn btn-primary btn-block">Log In</button>
                </form>
                
                <div class="mt-3 text-center">
                    <a href="<?php echo site_url(); ?>">Back to Homepage</a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
// Store the content in a global variable
$GLOBALS['page_content'] = ob_get_clean();

// Define a page title
$GLOBALS['page_title'] = 'Login';

// Add page-specific CSS
$GLOBALS['page_css'] = '<link rel="stylesheet" href="'. asset_path('css/pages/admin.css') .'?v=' . APP_VERSION . '">';

// Include the master layout
require_once ROOT_DIR . '/includes/master.php';