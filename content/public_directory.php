<?php
/**
 * reBB - Public Form Listings
 *
 * This file displays a list of all approved public forms.
 */

// Define the page content to be yielded in the master layout
ob_start();

// Initialize database path
$dbPath = ROOT_DIR . '/db';

// Initialize the public listings store
$publicListingsStore = new \SleekDB\Store('public_listings', $dbPath, [
    'auto_cache' => false,
    'timeout' => false
]);

// Get pagination parameters
$currentPage = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = 20; // Items per page
$skip = ($currentPage - 1) * $perPage;

// Get sorting parameters
$sortField = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'desc';

// Validate sort field
$allowedSortFields = ['form_name', 'username', 'created_at', 'last_updated'];
if (!in_array($sortField, $allowedSortFields)) {
    $sortField = 'created_at';
}

// Validate sort order
$allowedSortOrders = ['asc', 'desc'];
if (!in_array($sortOrder, $allowedSortOrders)) {
    $sortOrder = 'desc';
}

// Prepare sort parameter for URL
$sortParam = "&sort={$sortField}&order={$sortOrder}";

// Query for approved listings
$approvedListings = $publicListingsStore->createQueryBuilder()
    ->where([['is_approved', '=', true]])
    ->orderBy([$sortField => $sortOrder])
    ->limit($perPage)
    ->skip($skip)
    ->getQuery()
    ->fetch();

// Get total count for pagination - using fetch and count
$allApprovedListings = $publicListingsStore->createQueryBuilder()
    ->where([['is_approved', '=', true]])
    ->getQuery()
    ->fetch();
$totalListings = count($allApprovedListings);

$totalPages = ceil($totalListings / $perPage);

// For each listing, verify the form still exists and has the public flag set
$validListings = [];
foreach ($approvedListings as $listing) {
    $formId = $listing['form_id'];
    $formPath = STORAGE_DIR . '/forms/' . $formId . '_schema.json';
    
    if (file_exists($formPath)) {
        // Load the form data
        $formData = json_decode(file_get_contents($formPath), true);
        
        // Check if form is still marked as public
        if (isset($formData['public']) && $formData['public'] === true) {
            $validListings[] = $listing;
        }
    }
}
?>

<div class="container mt-4">
    <h1>Public Form Listings</h1>
    
    <div class="card">
        <div class="card-header">
            <div class="row">
                <div class="col-md-6">
                    <h5>Browse Public Forms</h5>
                </div>
                <div class="col-md-6 text-end">
                    <?php if (auth()->hasRole('admin')): ?>
                        <a href="<?php echo site_url('admin/directory'); ?>" class="btn btn-primary btn-sm">
                            <i class="bi bi-shield"></i> Admin Directory
                        </a>
                    <?php else: ?>
                        <a href="<?php echo site_url('builder'); ?>" class="btn btn-success btn-sm">
                            <i class="bi bi-plus-circle"></i> Create New Form
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <div class="card-body">
            <?php if (empty($validListings)): ?>
                <div class="alert alert-info">
                    No public forms available at this time.
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Form Name</th>
                                <th>Style</th>
                                <th>Creator</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($validListings as $listing): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($listing['form_name']); ?></td>
                                    <td>
                                        <span class="badge bg-secondary">
                                            <?php echo ucfirst(htmlspecialchars($listing['form_style'])); ?>
                                        </span>
                                    </td>
                                    <td><?php echo htmlspecialchars($listing['username']); ?></td>
                                    <td><?php echo date('M j, Y', $listing['created_at']); ?></td>
                                    <td>
                                        <a href="<?php echo site_url('form/' . $listing['form_id']); ?>" class="btn btn-sm btn-primary">
                                            <i class="bi bi-pencil-square"></i> Use Form
                                        </a>
                                        <?php if (auth()->isLoggedIn()): ?>
                                            <a href="<?php echo site_url('builder/' . $listing['form_id']); ?>" class="btn btn-sm btn-outline-secondary">
                                                <i class="bi bi-clipboard"></i> Use as Template
                                            </a>
                                        <?php endif; ?>
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
                                    <a class="page-link" href="?page=1<?php echo $sortParam; ?>" aria-label="First">
                                        <span aria-hidden="true">&laquo;&laquo;</span>
                                    </a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="?page=<?php echo $currentPage - 1; ?><?php echo $sortParam; ?>" aria-label="Previous">
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
                                    <a class="page-link" href="?page=<?php echo $i; ?><?php echo $sortParam; ?>"><?php echo $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            
                            <?php if ($currentPage < $totalPages): ?>
                                <li class="page-item">
                                    <a class="page-link" href="?page=<?php echo $currentPage + 1; ?><?php echo $sortParam; ?>" aria-label="Next">
                                        <span aria-hidden="true">&raquo;</span>
                                    </a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="?page=<?php echo $totalPages; ?><?php echo $sortParam; ?>" aria-label="Last">
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
                    Showing <?php echo count($validListings); ?> of <?php echo $totalListings; ?> public forms
                </div>
                <div class="col-md-6 text-end">
                    <small>Want to share your own form? Create a form and enable "Public Directory Listing"</small>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
// Store the content in a global variable
$GLOBALS['page_content'] = ob_get_clean();

// Define a page title
$GLOBALS['page_title'] = 'Public Form Listings';

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

// Add page-specific JavaScript
$GLOBALS['page_javascript'] = '
<script>
$(document).ready(function() {
    // Track page view for analytics
    if (typeof trackPageView === "function") {
        trackPageView("public_listings");
    }
});
</script>
';

// Include the master layout
require_once ROOT_DIR . '/includes/master.php';
?>