<?php
/**
 * reBB - Public Listings Admin
 *
 * This file allows administrators to manage public form listings.
 */

// Require admin authentication before processing anything else
auth()->requireRole('admin', 'login');

// Process form actions if submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // Initialize database path
    $dbPath = ROOT_DIR . '/db';
    
    // Initialize the public listings store
    $publicListingsStore = new \SleekDB\Store('public_listings', $dbPath, [
        'auto_cache' => false,
        'timeout' => false
    ]);
    
    $action = $_POST['action'];
    $listingId = isset($_POST['listing_id']) ? $_POST['listing_id'] : '';
    $redirectUrl = $_SERVER['REQUEST_URI'];
    
    // Validate listing ID
    if (empty($listingId)) {
        $_SESSION['admin_message'] = ['type' => 'danger', 'text' => 'Invalid listing ID provided'];
        header('Location: ' . $redirectUrl);
        exit;
    }
    
    // Get the listing
    $listing = $publicListingsStore->findById($listingId);
    if (!$listing) {
        $_SESSION['admin_message'] = ['type' => 'danger', 'text' => 'Listing not found'];
        header('Location: ' . $redirectUrl);
        exit;
    }
    
    // Process the action
    switch ($action) {
        case 'approve':
            // Update the listing
            $publicListingsStore->updateById($listingId, [
                'is_approved' => true,
                'last_updated' => time()
            ]);
            
            $_SESSION['admin_message'] = [
                'type' => 'success', 
                'text' => 'Form "' . htmlspecialchars($listing['form_name']) . '" has been approved'
            ];
            break;
            
        case 'unapprove':
            // Update the listing
            $publicListingsStore->updateById($listingId, [
                'is_approved' => false,
                'last_updated' => time()
            ]);
            
            $_SESSION['admin_message'] = [
                'type' => 'warning', 
                'text' => 'Form "' . htmlspecialchars($listing['form_name']) . '" has been unapproved'
            ];
            break;
            
        case 'delete':
            // Delete the listing
            $publicListingsStore->deleteById($listingId);
            
            $_SESSION['admin_message'] = [
                'type' => 'info', 
                'text' => 'Form "' . htmlspecialchars($listing['form_name']) . '" has been removed from public listings'
            ];
            break;
            
        default:
            $_SESSION['admin_message'] = ['type' => 'danger', 'text' => 'Invalid action'];
    }
    
    // Redirect to prevent form resubmission
    header('Location: ' . $redirectUrl);
    exit;
}

// Define the page content to be yielded in the master layout
ob_start();

// Initialize database path
$dbPath = ROOT_DIR . '/db';

// Initialize the public listings store
$publicListingsStore = new \SleekDB\Store('public_listings', $dbPath, [
    'auto_cache' => false,
    'timeout' => false
]);

// Get filter parameters
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
$query = isset($_GET['q']) ? $_GET['q'] : '';

// Get pagination parameters
$currentPage = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = 20; // Items per page
$skip = ($currentPage - 1) * $perPage;

// Get sorting parameters
$sortField = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'desc';

// Validate sort field
$allowedSortFields = ['form_name', 'username', 'created_at', 'last_updated', 'is_approved'];
if (!in_array($sortField, $allowedSortFields)) {
    $sortField = 'created_at';
}

// Validate sort order
$allowedSortOrders = ['asc', 'desc'];
if (!in_array($sortOrder, $allowedSortOrders)) {
    $sortOrder = 'desc';
}

// Build the query based on filter
$queryBuilder = $publicListingsStore->createQueryBuilder();

// Apply text search if provided
if (!empty($query)) {
    $queryBuilder->where([
        ['form_name', 'LIKE', "%{$query}%"],
        'OR',
        ['username', 'LIKE', "%{$query}%"]
    ]);
}

// Apply status filter
if ($filter === 'pending') {
    $queryBuilder->where([['is_approved', '=', false]]);
} elseif ($filter === 'approved') {
    $queryBuilder->where([['is_approved', '=', true]]);
}

// Apply sorting
$queryBuilder->orderBy([$sortField => $sortOrder]);

// Get total count for pagination (before applying limit/skip)
// First clone the query builder to use for counting
$countQueryBuilder = clone $queryBuilder;
$totalListings = count($countQueryBuilder->getQuery()->fetch());

// Apply pagination
$listings = $queryBuilder->limit($perPage)->skip($skip)->getQuery()->fetch();

$totalPages = ceil($totalListings / $perPage);

// Prepare URL parameters for pagination links
$urlParams = [];
if (!empty($filter) && $filter !== 'all') $urlParams[] = "filter={$filter}";
if (!empty($query)) $urlParams[] = "q={$query}";
if ($sortField !== 'created_at') $urlParams[] = "sort={$sortField}";
if ($sortOrder !== 'desc') $urlParams[] = "order={$sortOrder}";
$urlParamString = !empty($urlParams) ? '&' . implode('&', $urlParams) : '';



// For each listing, verify if the associated form still exists
foreach ($listings as &$listing) {
    $formId = $listing['form_id'];
    $formPath = STORAGE_DIR . '/forms/' . $formId . '_schema.json';
    
    $listing['form_exists'] = file_exists($formPath);
    
    // If form exists, check if it's still marked as public
    if ($listing['form_exists']) {
        $formData = json_decode(file_get_contents($formPath), true);
        $listing['is_public'] = isset($formData['public']) && $formData['public'] === true;
    } else {
        $listing['is_public'] = false;
    }
}
?>

<div class="container-fluid mt-4">
    <div class="row">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h1>Public Listings Management</h1>
                <a href="<?php echo site_url('admin'); ?>" class="btn btn-secondary">
                    <i class="bi bi-arrow-left"></i> Back to Admin
                </a>
            </div>
            
            <?php if (isset($_SESSION['admin_message'])): ?>
                <div class="alert alert-<?php echo $_SESSION['admin_message']['type']; ?> alert-dismissible fade show" role="alert">
                    <?php echo $_SESSION['admin_message']['text']; ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
                <?php unset($_SESSION['admin_message']); ?>
            <?php endif; ?>
            
            <div class="card">
                <div class="card-header">
                    <div class="row align-items-center">
                        <div class="col-md-6 mb-2 mb-md-0">
                            <div class="btn-group">
                                <a href="?filter=all<?php echo str_replace("filter={$filter}", "", $urlParamString); ?>" 
                                   class="btn btn-outline-primary <?php echo $filter === 'all' ? 'active' : ''; ?>">
                                    All
                                </a>
                                <a href="?filter=pending<?php echo str_replace("filter={$filter}", "", $urlParamString); ?>" 
                                   class="btn btn-outline-warning <?php echo $filter === 'pending' ? 'active' : ''; ?>">
                                    Pending
                                </a>
                                <a href="?filter=approved<?php echo str_replace("filter={$filter}", "", $urlParamString); ?>" 
                                   class="btn btn-outline-success <?php echo $filter === 'approved' ? 'active' : ''; ?>">
                                    Approved
                                </a>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <form method="get" class="d-flex">
                                <?php if ($filter !== 'all'): ?>
                                    <input type="hidden" name="filter" value="<?php echo htmlspecialchars($filter); ?>">
                                <?php endif; ?>
                                <?php if ($sortField !== 'created_at'): ?>
                                    <input type="hidden" name="sort" value="<?php echo htmlspecialchars($sortField); ?>">
                                <?php endif; ?>
                                <?php if ($sortOrder !== 'desc'): ?>
                                    <input type="hidden" name="order" value="<?php echo htmlspecialchars($sortOrder); ?>">
                                <?php endif; ?>
                                <input type="text" name="q" class="form-control" placeholder="Search forms or users" 
                                       value="<?php echo htmlspecialchars($query); ?>">
                                <button type="submit" class="btn btn-primary ms-2">
                                    <i class="bi bi-search"></i>
                                </button>
                                <?php if (!empty($query)): ?>
                                    <a href="?<?php echo $filter !== 'all' ? "filter={$filter}" : ""; ?>" class="btn btn-outline-secondary ms-2">
                                        <i class="bi bi-x-circle"></i>
                                    </a>
                                <?php endif; ?>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <?php if (empty($listings)): ?>
                        <div class="alert alert-info">
                            No listings found matching your criteria.
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Form Name</th>
                                        <th>Style</th>
                                        <th>Creator</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($listings as &$listing): ?>
                                        <tr class="<?php echo (!$listing['form_exists']) ? 'table-danger' : ($listing['form_exists'] && !$listing['is_public'] ? 'table-warning' : ''); ?>">
                                            <td>
                                                <?php echo htmlspecialchars($listing['form_name']); ?>
                                                <?php if (!$listing['form_exists']): ?>
                                                    <span class="badge bg-danger">Form Deleted</span>
                                                <?php elseif (!$listing['is_public']): ?>
                                                    <span class="badge bg-warning text-dark">Not Public</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <span class="badge bg-secondary">
                                                    <?php echo ucfirst(htmlspecialchars($listing['form_style'])); ?>
                                                </span>
                                            </td>
                                            <td>
                                                <?php echo htmlspecialchars($listing['username']); ?>
                                                <?php if (isset($listing['is_guest']) && $listing['is_guest']): ?>
                                                    <span class="badge bg-info">Guest</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if (isset($listing['is_approved']) && $listing['is_approved']): ?>
                                                    <span class="badge bg-success">Approved</span>
                                                <?php else: ?>
                                                    <span class="badge bg-warning text-dark">Pending</span>
                                                <?php endif; ?>
                                            </td>
                                            <td><?php echo date('M j, Y', $listing['created_at']); ?></td>
                                            <td><?php echo isset($listing['last_updated']) ? date('M j, Y', $listing['last_updated']) : 'N/A'; ?></td>
                                            <td>
                                                <div class="btn-group">
                                                    <?php if ($listing['form_exists']): ?>
                                                        <a href="<?php echo site_url('form/' . $listing['form_id']); ?>" 
                                                           class="btn btn-sm btn-outline-primary" target="_blank">
                                                            <i class="bi bi-eye"></i> View
                                                        </a>
                                                    <?php endif; ?>
                                                    
                                                    <?php if ($listing['form_exists']): ?>
                                                        <?php if (!isset($listing['is_approved']) || !$listing['is_approved']): ?>
                                                            <form method="post" style="display: inline;">
                                                                <input type="hidden" name="action" value="approve">
                                                                <input type="hidden" name="listing_id" value="<?php echo htmlspecialchars($listing['_id']); ?>">
                                                                <button type="submit" class="btn btn-sm btn-success" 
                                                                        onclick="return confirm('Are you sure you want to approve this listing?');">
                                                                    <i class="bi bi-check-circle"></i> Approve
                                                                </button>
                                                            </form>
                                                        <?php else: ?>
                                                            <form method="post" style="display: inline;">
                                                                <input type="hidden" name="action" value="unapprove">
                                                                <input type="hidden" name="listing_id" value="<?php echo htmlspecialchars($listing['_id']); ?>">
                                                                <button type="submit" class="btn btn-sm btn-warning" 
                                                                        onclick="return confirm('Are you sure you want to unapprove this listing?');">
                                                                    <i class="bi bi-x-circle"></i> Unapprove
                                                                </button>
                                                            </form>
                                                        <?php endif; ?>
                                                    <?php endif; ?>
                                                    
                                                    <form method="post" style="display: inline;">
                                                        <input type="hidden" name="action" value="delete">
                                                        <input type="hidden" name="listing_id" value="<?php echo htmlspecialchars($listing['_id']); ?>">
                                                        <button type="submit" class="btn btn-sm btn-danger" 
                                                                onclick="return confirm('Are you sure you want to delete this listing? This will only remove it from public listings, not delete the form itself.');">
                                                            <i class="bi bi-trash"></i> Delete
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <?php if ($totalPages > 1): ?>
                            <nav aria-label="Page navigation">
                                <ul class="pagination justify-content-center">
                                    <?php if ($currentPage > 1): ?>
                                        <li class="page-item">
                                            <a class="page-link" href="?page=1<?php echo $urlParamString; ?>" aria-label="First">
                                                <span aria-hidden="true">&laquo;&laquo;</span>
                                            </a>
                                        </li>
                                        <li class="page-item">
                                            <a class="page-link" href="?page=<?php echo $currentPage - 1; ?><?php echo $urlParamString; ?>" aria-label="Previous">
                                                <span aria-hidden="true">&laquo;</span>
                                            </a>
                                        </li>
                                    <?php else: ?>
                                        <li class="page-item disabled">
                                            <a class="page-link" href="#" aria-label="First">
                                                <span aria-hidden="true">&laquo;&laquo;</span>
                                            </a>
                                        </li>
                                        <li class="page-item disabled">
                                            <a class="page-link" href="#" aria-label="Previous">
                                                <span aria-hidden="true">&laquo;</span>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                    
                                    <?php
                                    // Calculate page range to display
                                    $startPage = max(1, $currentPage - 2);
                                    $endPage = min($totalPages, $startPage + 4);
                                    $startPage = max(1, $endPage - 4);
                                    
                                    for ($i = $startPage; $i <= $endPage; $i++):
                                    ?>
                                        <li class="page-item <?php echo ($i == $currentPage) ? 'active' : ''; ?>">
                                            <a class="page-link" href="?page=<?php echo $i; ?><?php echo $urlParamString; ?>"><?php echo $i; ?></a>
                                        </li>
                                    <?php endfor; ?>
                                    
                                    <?php if ($currentPage < $totalPages): ?>
                                        <li class="page-item">
                                            <a class="page-link" href="?page=<?php echo $currentPage + 1; ?><?php echo $urlParamString; ?>" aria-label="Next">
                                                <span aria-hidden="true">&raquo;</span>
                                            </a>
                                        </li>
                                        <li class="page-item">
                                            <a class="page-link" href="?page=<?php echo $totalPages; ?><?php echo $urlParamString; ?>" aria-label="Last">
                                                <span aria-hidden="true">&raquo;&raquo;</span>
                                            </a>
                                        </li>
                                    <?php else: ?>
                                        <li class="page-item disabled">
                                            <a class="page-link" href="#" aria-label="Next">
                                                <span aria-hidden="true">&raquo;</span>
                                            </a>
                                        </li>
                                        <li class="page-item disabled">
                                            <a class="page-link" href="#" aria-label="Last">
                                                <span aria-hidden="true">&raquo;&raquo;</span>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                </ul>
                            </nav>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
                
                <div class="card-footer text-muted">
                    <div class="row">
                        <div class="col-md-6">
                            Total: <?php echo $totalListings; ?> listings
                        </div>
                        <div class="col-md-6 text-end">
                            <small class="text-muted">
                                <span class="text-danger">Red rows</span>: Form deleted | 
                                <span class="text-warning">Yellow rows</span>: Form no longer marked as public
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
// Store the content in a global variable
$GLOBALS['page_content'] = ob_get_clean();

// Define a page title
$GLOBALS['page_title'] = 'Public Listings Admin';

// Add page-specific CSS
$GLOBALS['page_css'] = '
<style>
    .badge {
        font-size: 0.85rem;
    }
    .table-responsive {
        overflow-x: auto;
    }
    @media (max-width: 576px) {
        .table {
            font-size: 0.9rem;
        }
        .btn-sm {
            font-size: 0.7rem;
            padding: 0.25rem 0.5rem;
        }
    }
</style>
';

// Include the master layout
require_once ROOT_DIR . '/includes/master.php';
?>