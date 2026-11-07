package com.piclex.portable;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.util.ArrayList;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/piclex-web/";
    private static final int FILE_PICKER = 101;
    private static final int MEDIA_PERMISSION = 102;
    private WebView view;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingPermission;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        view = new WebView(this);
        setContentView(view);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/piclex-web/",
                        new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        view.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(
                    WebView webView, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(
                    WebView webView, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
                        && uri.getPath() != null && uri.getPath().startsWith("/piclex-web/")) {
                    return false;
                }
                if ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (Exception ignored) { }
                    return true;
                }
                if ("mailto".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_SENDTO, uri)); }
                    catch (Exception ignored) { }
                }
                return true;
            }
        });
        view.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleMediaPermission(request));
            }
            @Override public boolean onShowFileChooser(
                    WebView webView, ValueCallback<Uri[]> result,
                    FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = result;
                try {
                    startActivityForResult(params.createIntent(), FILE_PICKER);
                    return true;
                } catch (Exception error) {
                    fileCallback = null;
                    return false;
                }
            }
        });
        view.loadUrl(HOME);
    }

    private void handleMediaPermission(PermissionRequest request) {
        Uri origin = request.getOrigin();
        if (!"https".equals(origin.getScheme()) || !HOST.equals(origin.getHost())) {
            request.deny(); return;
        }
        ArrayList<String> missing = new ArrayList<>();
        for (String resource : request.getResources()) {
            String androidPermission;
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                androidPermission = Manifest.permission.CAMERA;
            } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                androidPermission = Manifest.permission.RECORD_AUDIO;
            } else {
                request.deny(); return;
            }
            if (checkSelfPermission(androidPermission) != PackageManager.PERMISSION_GRANTED
                    && !missing.contains(androidPermission)) {
                missing.add(androidPermission);
            }
        }
        if (missing.isEmpty()) {
            request.grant(request.getResources());
        } else {
            if (pendingPermission != null) pendingPermission.deny();
            pendingPermission = request;
            requestPermissions(missing.toArray(new String[0]), MEDIA_PERMISSION);
        }
    }

    @Override public void onRequestPermissionsResult(
            int code, String[] permissions, int[] grants) {
        super.onRequestPermissionsResult(code, permissions, grants);
        if (code != MEDIA_PERMISSION || pendingPermission == null) return;
        boolean allGranted = grants.length == permissions.length && grants.length > 0;
        for (int grant : grants) {
            if (grant != PackageManager.PERMISSION_GRANTED) allGranted = false;
        }
        PermissionRequest current = pendingPermission;
        pendingPermission = null;
        if (allGranted) current.grant(current.getResources());
        else current.deny();
    }

    @Override protected void onActivityResult(int code, int resultCode, Intent data) {
        super.onActivityResult(code, resultCode, data);
        if (code == FILE_PICKER && fileCallback != null) {
            fileCallback.onReceiveValue(
                    WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }
    @Override public void onBackPressed() {
        if (view != null && view.canGoBack()) view.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (pendingPermission != null) { pendingPermission.deny(); pendingPermission = null; }
        if (view != null) { view.destroy(); view = null; }
        super.onDestroy();
    }
}
