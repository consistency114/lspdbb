<?php
/**
 * reBB – Form Renderer  (JS-scan disabled)
 *
 * Renders a stored form for end-users.
 *  – Dangerous-JS pattern detection stripped out
 *  – Security warning banner removed
 *  – Sensitive-information banner kept
 */

/* ─────────────────────────────
 * 0· CONSTANTS & PRELUDE
 * ───────────────────────────── */
$dangerousPatterns = [];                     // JS scan disabled
function scanForDangerousPatterns($c,$p){return[];}  // stub

/* ───────── Sensitive-field checker (unchanged) ───────── */
function detectSensitiveInformation($data,$template=''){
    $sensitive=['password','passcode','passwd','pwd'];
    $json  = strtolower(json_encode($data,JSON_UNESCAPED_UNICODE));
    $templ = strtolower($template);
    $fieldPat=['"type":"password"','password','type="password"','<input[^>]*type="password"','\bpin\b',
               'secret','ssn','secure','credentials'];
    foreach($fieldPat as $p){
        if(preg_match('/'.$p.'/i',$json)||(!empty($template)&&preg_match('/'.$p.'/i',$templ)))
            return true;
    }
    foreach($sensitive as $kw){
        $re='/\b'.preg_quote($kw,'/').'\b/i';
        if(preg_match($re,$json)||(!empty($template)&&preg_match($re,$templ))) return true;
    }
    return is_array($data)?recursiveKeyScan($data,$sensitive):false;
}
function recursiveKeyScan($arr,$keys){
    foreach($arr as $k=>$v){
        foreach($keys as $kw){
            $re='/\b'.preg_quote($kw,'/').'\b/i';
            if((is_string($k)&&preg_match($re,$k))||(is_string($v)&&preg_match($re,$v)))
                return true;
        }
        if(is_array($v)&&recursiveKeyScan($v,$keys)) return true;
    }
    return false;
}

/* ─────────────────────────────
 * 1· INITIAL FLAGS / INPUTS
 * ───────────────────────────── */
$isJsonReq=false;$formName='';$dangerousJSDetected=false;
$formNameDisplay='';$formStyle='default';$showAlert=false;
$bypassSecurity=isset($_GET['confirm'])&&$_GET['confirm']==='1';
$isVerified=false;$isBlacklisted=false;$blackMsg='';$formWidth=45;

if(isset($_GET['f'])){
    $raw=$_GET['f'];
    $isJsonReq=str_ends_with($raw,'/json');
    $formName=preg_replace('/[^a-zA-Z0-9_\-]/','',$isJsonReq?substr($raw,0,-5):$raw);
}

/* ───────────── 2· JSON API ───────────── */
if($isJsonReq){
    if(ENABLE_JSON_VIEW||auth()->hasRole('admin')){
        $file=STORAGE_DIR."/forms/{$formName}_schema.json";
        header('Content-Type:'.(file_exists($file)?'application/json':'text/plain'));
        echo file_exists($file)?file_get_contents($file)
             :"Form JSON not found for form: ".htmlspecialchars($formName);
    }else{
        header('Content-Type:text/plain'); echo "ENABLE_JSON_VIEW is disabled!";
    } exit;
}

/* ───────────── 3· LOAD FORM META ───────────── */
header('Content-Type:text/html');
$formSchema=$formTemplate=$tplTitle=$tplLink='';
$tplTitleOn=$tplLinkOn=false;

if($formName){
    $f=STORAGE_DIR."/forms/{$formName}_schema.json";
    if(file_exists($f)){
        $d=json_decode(file_get_contents($f),true);
        $formSchema      =$d['schema']??null;
        $formTemplate    =$d['template']??'';
        $tplTitle        =$d['templateTitle']??'';
        $tplLink         =$d['templateLink']??'';
        $tplTitleOn      =$d['enableTemplateTitle']??false;
        $tplLinkOn       =$d['enableTemplateLink']??false;
        $formStyle       =$d['formStyle']??'default';
        $formNameDisplay =$d['formName']??'';
        $isVerified      =!empty($d['verified']);
        $isBlacklisted   =!empty($d['blacklisted']);
        $blackMsg        =$isBlacklisted?$d['blacklisted']:'';
        if(isset($d['formWidth'])&&is_numeric($d['formWidth']))
            $formWidth=max(20,min(100,(int)$d['formWidth']));
        if($formSchema&&!$isVerified)
            $showAlert=detectSensitiveInformation($formSchema,$formTemplate);
    }
}

/* ───────────── 4· VIEW ───────────── */
ob_start();
?>
<?php if($showAlert&&!$isVerified): ?>
<div class="alert alert-warning">
 <strong>Warning:</strong> This form appears to request sensitive information
 (passwords, passcodes, etc.). Proceed only if you trust the source.
</div>
<?php endif; ?>

<?php if($isBlacklisted): ?>
<div class="security-warning-container">
  <div class="security-warning">
    <h3><i class="bi bi-shield-exclamation"></i> Form Blocked</h3>
    <p class="warning-text"><?= htmlspecialchars($blackMsg) ?></p>
    <div class="action-buttons">
      <a href="index.php" class="btn btn-secondary">Return to Home</a>
    </div>
  </div>
</div>
<?php elseif(!$formSchema): ?>
<div class="alert alert-danger">
  <?= isset($_GET['f'])
     ?"Form '".htmlspecialchars($_GET['f'])."' not found or invalid schema."
     :"Form parameter missing. Please provide a valid form identifier." ?>
</div>
<?php else: ?>
<div id="form-container">
  <?php if($isVerified): ?>
  <a href="<?= site_url('docs') ?>?doc=verified-forms.md" class="verified-badge"
     title="Learn about verified forms">
     <i class="bi bi-check-circle-fill"></i> Verified Form
  </a>
  <?php endif; ?>
  <?php if($formNameDisplay): ?>
     <h2 class="text-center mb-4"><?= htmlspecialchars($formNameDisplay) ?></h2>
  <?php endif; ?>
  <div id="formio"></div>
</div>

<div id="output-container">
  <h4>Generated Output:</h4>
  <div id="template-title-container" class="mb-3"
       style="display:<?= ($tplTitleOn&&$tplTitle)?'block':'none' ?>">
    <small class="text-muted">Title</small>
    <input type="text" id="generated-title" class="form-control mb-2" readonly>
  </div>
  <small class="text-muted">Content</small>
  <textarea id="output" class="form-control" rows="5" readonly></textarea>
  <div class="mt-2 text-end">
    <button id="copyOutputBtn" class="btn btn-primary">
      <i class="bi bi-clipboard"></i> Copy to Clipboard
    </button>
    <a id="postContentBtn" class="btn btn-success ms-2"
       style="display:<?= ($tplLinkOn&&$tplLink)?'inline-block':'none' ?>"
       target="_blank">
       <i class="bi bi-box-arrow-up-right"></i> Post Content
    </a>
  </div>
</div>
<?php endif; ?>
<?php
$GLOBALS['page_content']  = ob_get_clean();
$GLOBALS['page_title']    = $formNameDisplay;
$GLOBALS['page_settings'] = ['formio_assets'=>true,'footer'=>'form'];

/* ───────────── 5· ASSET CSS ───────────── */
$allowed=['default','paperwork','vector','retro','modern'];
$formStyle=in_array($formStyle,$allowed)?$formStyle:'default';
$css  = '<link rel="stylesheet" href="'.asset_path("css/forms/{$formStyle}.css").'?v='.APP_VERSION.'">'.PHP_EOL;
$css .= '<link rel="stylesheet" href="'.asset_path("css/forms/{$formStyle}-dark.css").'?v='.APP_VERSION.'">'.PHP_EOL;
if($isBlacklisted){
    $css .= '<link rel="stylesheet" href="'.asset_path("css/security-warning.css").'?v='.APP_VERSION.'">';
}
$css .= "
<style>
#form-container{max-width:{$formWidth}%;margin:0 auto;}
@media(max-width:768px){#form-container{max-width:95%;}}
.verified-badge{position:fixed;top:15px;right:15px;background:#198754;color:#fff!important;
  padding:5px 10px;border-radius:20px;font-size:.8rem;display:flex;gap:5px;z-index:1000;
  box-shadow:0 2px 5px rgba(0,0,0,.2);transition:.2s;}
.verified-badge:hover{background:#146c43;box-shadow:0 3px 8px rgba(0,0,0,.3);}
</style>";
$GLOBALS['page_css']=$css;

/* ───────────── 6· JS VARS & SCRIPTS ───────────── */
if(!$isBlacklisted){
    $schemaJSON   = json_encode($formSchema,
                    JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|
                    JSON_HEX_TAG|JSON_HEX_QUOT);
    $templateJSON = json_encode($formTemplate,JSON_UNESCAPED_SLASHES);

    $tplTitleJS   = $tplTitleOn ? json_encode($tplTitle) : 'null';
    $tplLinkJS    = $tplLinkOn  ? json_encode($tplLink)  : 'null';
    $tplTitleOnJS = $tplTitleOn ? 'true' : 'false';
    $tplLinkOnJS  = $tplLinkOn  ? 'true' : 'false';

    $siteURL   = site_url();
    $jsonURL   = JSON_URL;
    $assetsURL = asset_path('js/');

    $GLOBALS['page_js_vars'] = <<<JS
const formSchema         = $schemaJSON;
const formTemplate       = $templateJSON;
const formTemplateTitle  = $tplTitleJS;
const formTemplateLink   = $tplLinkJS;
const enableTemplateTitle= $tplTitleOnJS;
const enableTemplateLink = $tplLinkOnJS;
let siteURL              = "$siteURL";
let jsonURL              = "$jsonURL";
let ASSETS_BASE_PATH     = "$assetsURL";
JS;

    $GLOBALS['page_javascript'] = '
      <script src="'.asset_path('js/components/components.js').'?v='.APP_VERSION.'"></script>
      <script src="'.asset_path('js/app/custom.js').'?v='.APP_VERSION.'"></script>
      <script src="'.asset_path('js/components/custom/portraitimagecomponent.js').'"></script>
      <script src="'.asset_path('js/app/form.js').'?v='.APP_VERSION.'"></script>';
} else {
    $GLOBALS['page_js_vars']=''; $GLOBALS['page_javascript']='';
}

/* ───────────── 7· LAYOUT ───────────── */
require_once ROOT_DIR.'/includes/master.php';
