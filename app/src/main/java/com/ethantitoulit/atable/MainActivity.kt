package com.ethantitoulit.atable

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.text.InputType
import android.widget.EditText
import android.widget.Toast
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AlertDialog
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingWebPermission: PermissionRequest? = null
    private var pinDialogVisible = false
    private var webSearchMode = false

    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        fileCallback?.onReceiveValue(uris)
        fileCallback = null
    }

    private val cameraPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        pendingWebPermission?.let { request ->
            if (granted) request.grant(request.resources) else request.deny()
        }
        pendingWebPermission = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        swipeRefresh = SwipeRefreshLayout(this).apply {
            addView(webView)
            setOnRefreshListener { webView.reload() }
            setOnChildScrollUpCallback { _, _ -> webView.canScrollVertically(-1) }
        }
        ViewCompat.setOnApplyWindowInsetsListener(swipeRefresh) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        setContentView(swipeRefresh)

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = false
            userAgentString = "$userAgentString ATableAndroid/1.0"
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                swipeRefresh.isRefreshing = false
                val host = Uri.parse(url).host
                if (isInternalHost(host)) {
                    webSearchMode = false
                    if (!hasMobileSession()) showPinDialog()
                } else if (webSearchMode && !isSearchHost(host)) {
                    injectImportButton(view)
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return if (uri.scheme == "http" || uri.scheme == "https") {
                    if (isInternalHost(uri.host)) {
                        false
                    } else if (isSearchHost(uri.host) || webSearchMode) {
                        webSearchMode = true
                        false
                    } else {
                        openInBrowser(uri)
                        true
                    }
                } else {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                    true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                filePicker.launch(params.createIntent())
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(request.resources)
                        } else {
                            pendingWebPermission = request
                            cameraPermission.launch(Manifest.permission.CAMERA)
                        }
                    } else {
                        request.deny()
                    }
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (!openSharedRecipe(intent)) {
            if (savedInstanceState == null) webView.loadUrl(APP_URL)
            else webView.restoreState(savedInstanceState)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        openSharedRecipe(intent)
    }

    private fun isInternalHost(host: String?): Boolean {
        val normalized = host?.lowercase().orEmpty()
        return normalized == APP_HOST ||
            normalized == "chatgpt.com" || normalized.endsWith(".chatgpt.com") ||
            normalized == "openai.com" || normalized.endsWith(".openai.com")
    }

    private fun openInBrowser(uri: Uri) {
        val browserIntent = Intent(Intent.ACTION_VIEW, uri).apply {
            addCategory(Intent.CATEGORY_BROWSABLE)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { startActivity(browserIntent) }
    }

    private fun isSearchHost(host: String?): Boolean {
        val normalized = host?.lowercase().orEmpty()
        return normalized == "google.com" || normalized.endsWith(".google.com") ||
            normalized == "share.google" || normalized.endsWith(".share.google") ||
            normalized == "bing.com" || normalized.endsWith(".bing.com")
    }

    private fun injectImportButton(view: WebView) {
        val script = """
            (() => {
              if (document.getElementById('atable-import-button')) return;
              const button = document.createElement('button');
              button.id = 'atable-import-button';
              button.type = 'button';
              button.textContent = '+  Importer dans À table';
              button.setAttribute('aria-label', 'Importer cette recette dans À table');
              Object.assign(button.style, {
                position: 'fixed', left: '16px', right: '16px', bottom: '18px',
                zIndex: '2147483647', minHeight: '56px', border: '0',
                borderRadius: '28px', background: '#1f6b50', color: '#fff',
                fontSize: '17px', fontWeight: '800', fontFamily: 'sans-serif',
                boxShadow: '0 8px 28px rgba(0,0,0,.28)'
              });
              button.addEventListener('click', () => {
                const recipeData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                  .map((node) => node.textContent || '')
                  .find((content) => /["']Recipe["']/.test(content)) || '';
                const destination = '${APP_URL}?url=' + encodeURIComponent(location.href) +
                  '&title=' + encodeURIComponent(document.title || 'Recette du Web') +
                  (recipeData ? '#recipeData=' + encodeURIComponent(recipeData) : '');
                location.href = destination;
              });
              document.documentElement.style.paddingBottom = '88px';
              document.body.appendChild(button);
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    private fun hasMobileSession(): Boolean =
        CookieManager.getInstance().getCookie(APP_URL)?.split(";")?.any {
            it.trim().startsWith("atable_mobile=")
        } == true

    private fun showPinDialog() {
        if (pinDialogVisible || isFinishing) return
        pinDialogVisible = true
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "Code à 4 chiffres"
            maxLines = 1
        }
        val dialog = AlertDialog.Builder(this)
            .setTitle("Déverrouiller À table")
            .setMessage("Saisissez votre code une seule fois sur cet appareil.")
            .setView(input)
            .setNegativeButton("Plus tard") { _, _ -> pinDialogVisible = false }
            .setPositiveButton("Déverrouiller", null)
            .create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val pin = input.text.toString().trim()
                if (pin.length != 4) {
                    input.error = "Saisissez les 4 chiffres"
                } else {
                    dialog.getButton(AlertDialog.BUTTON_POSITIVE).isEnabled = false
                    loginWithPin(pin, dialog)
                }
            }
        }
        dialog.setOnDismissListener { pinDialogVisible = false }
        dialog.show()
    }

    private fun loginWithPin(pin: String, dialog: AlertDialog) {
        Thread {
            val result = runCatching {
                val connection = (URL("${APP_URL}api/mobile-login").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 12_000
                    readTimeout = 12_000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }
                connection.outputStream.use { it.write(JSONObject().put("pin", pin).toString().toByteArray()) }
                val status = connection.responseCode
                val cookie = connection.headerFields["Set-Cookie"]?.firstOrNull()
                connection.disconnect()
                status to cookie
            }.getOrElse { -1 to null }
            runOnUiThread {
                val (status, cookie) = result
                if (status in 200..299 && cookie != null) {
                    CookieManager.getInstance().setCookie(APP_URL, cookie) {
                        CookieManager.getInstance().flush()
                        dialog.dismiss()
                        webView.reload()
                    }
                } else {
                    dialog.getButton(AlertDialog.BUTTON_POSITIVE).isEnabled = true
                    Toast.makeText(
                        this,
                        if (status == 429) "Trop d’essais. Réessayez dans quelques minutes." else "Code incorrect",
                        Toast.LENGTH_LONG,
                    ).show()
                }
            }
        }.start()
    }

    private fun openSharedRecipe(intent: Intent?): Boolean {
        if (intent?.action != Intent.ACTION_SEND || intent.type?.startsWith("text/") != true) return false
        val text = intent.getStringExtra(Intent.EXTRA_TEXT).orEmpty()
        val url = URL_PATTERN.find(text)?.value?.trimEnd('.', ',', ';', '!', '?', ')') ?: return false
        val title = intent.getStringExtra(Intent.EXTRA_SUBJECT).orEmpty()
        if (Uri.parse(url).host?.equals("share.google", ignoreCase = true) == true) {
            webSearchMode = true
            webView.loadUrl(url)
            intent.action = null
            return true
        }
        val importUrl = Uri.parse(APP_URL).buildUpon()
            .appendQueryParameter("url", url)
            .appendQueryParameter("title", title)
            .build()
            .toString()
        webView.loadUrl(importUrl)
        intent.action = null
        return true
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        fileCallback?.onReceiveValue(null)
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val APP_URL = "https://quest-ce-quon-mange.ethantitoulit.chatgpt.site/"
        private const val APP_HOST = "quest-ce-quon-mange.ethantitoulit.chatgpt.site"
        private val URL_PATTERN = Regex("""https?://\S+""", RegexOption.IGNORE_CASE)
    }
}
