/*
 * Copyright (c) 2017-2019 Altimit Community Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or imp
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package systems.altimit.rpgmakermv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import androidx.appcompat.app.AlertDialog;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.view.KeyEvent;
import android.widget.TextView;

import java.io.File;
import java.nio.charset.Charset;

/**
 * Created by felixjones on 28/04/2017.
 */
public class WebPlayerActivity extends Activity {

    private static final String TOUCH_INPUT_ON_CANCEL = "TouchInput._onCancel();";
    private static final String LEFT_BUTTON_PRESS = "TouchInput._onLeftButtonPress();";
    private static final String LEFT_BUTTON_RELEASE = "TouchInput._onLeftButtonRelease();";
    private static final String RIGHT_BUTTON_PRESS = "TouchInput._onRightButtonPress();";
    private static final String RIGHT_BUTTON_RELEASE = "TouchInput._onRightButtonRelease();";

    private Player mPlayer;
    private AlertDialog mQuitDialog;
    private int mSystemUiVisibility;

    // 添加触摸按钮相关变量
    private FrameLayout mContainerLayout;

    // 键码常量
    private static final int KEYCODE_UP = KeyEvent.KEYCODE_DPAD_UP;
    private static final int KEYCODE_DOWN = KeyEvent.KEYCODE_DPAD_DOWN;
    private static final int KEYCODE_LEFT = KeyEvent.KEYCODE_DPAD_LEFT;
    private static final int KEYCODE_RIGHT = KeyEvent.KEYCODE_DPAD_RIGHT;
    private static final int KEYCODE_SPACE = KeyEvent.KEYCODE_SPACE;
    private static final int KEYCODE_TAB = KeyEvent.KEYCODE_TAB;
    private static final int KEYCODE_ESC = KeyEvent.KEYCODE_ESCAPE;

    @SuppressLint("ObsoleteSdkInt")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (BuildConfig.BACK_BUTTON_QUITS) {
            createQuitDialog();
        }

        mSystemUiVisibility = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            mSystemUiVisibility |= View.SYSTEM_UI_FLAG_FULLSCREEN;
            mSystemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            mSystemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            mSystemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                mSystemUiVisibility |= View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            }
        }

        mPlayer = PlayerHelper.create(this);
        mPlayer.setKeepScreenOn();

        // 创建容器布局
        mContainerLayout = new FrameLayout(this);
        setContentView(mContainerLayout);

        // 添加WebView到容器
        View webView = mPlayer.getView();
        mContainerLayout.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        // 添加触摸按钮
        addTouchButtons();

        if (!addBootstrapInterface(mPlayer)) {
            Uri.Builder projectURIBuilder = Uri.fromFile(new File(getString(R.string.mv_project_index))).buildUpon();
            Bootstrapper.appendQuery(projectURIBuilder, getString(R.string.query_noaudio));
            if (BuildConfig.SHOW_FPS) {
                Bootstrapper.appendQuery(projectURIBuilder, getString(R.string.query_showfps));
            }
            mPlayer.loadUrl(projectURIBuilder.build().toString());
        }
    }

    /**
     * 添加屏幕触摸按钮
     */
    private void addTouchButtons() {
        DisplayMetrics metrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);
        int screenWidth = metrics.widthPixels;
        int screenHeight = metrics.heightPixels;

        // 计算按钮大小和位置
        int buttonSize = Math.min(screenWidth, screenHeight) / 8;
        int buttonMargin = buttonSize / 4;
        int largeButtonSize = (int) (buttonSize * 1.5);

        // 创建左下角的Tab和Esc按钮
        createLeftBottomButtons(buttonSize, buttonMargin);

        // 创建右下角的方向键和空格键
        createRightBottomControls(buttonSize, largeButtonSize, buttonMargin);
    }

    /**
     * 创建左下角的Tab和Esc按钮
     */
    private void createLeftBottomButtons(int buttonSize, int buttonMargin) {
        // 创建Tab按钮
        TextView tabButton = createTextButton(buttonSize, "Tab", KEYCODE_TAB);
        FrameLayout.LayoutParams tabParams = new FrameLayout.LayoutParams(buttonSize, buttonSize);
        tabParams.setMargins(buttonMargin, 0, 0, buttonMargin);
        tabParams.gravity = Gravity.BOTTOM | Gravity.LEFT;
        mContainerLayout.addView(tabButton, tabParams);

        // 创建Esc按钮
        TextView escButton = createTextButton(buttonSize, "Esc", KEYCODE_ESC);
        FrameLayout.LayoutParams escParams = new FrameLayout.LayoutParams(buttonSize, buttonSize);
        escParams.setMargins(buttonMargin, 0, 0, buttonMargin + buttonSize + buttonMargin/2);
        escParams.gravity = Gravity.BOTTOM | Gravity.LEFT;
        mContainerLayout.addView(escButton, escParams);
    }

    /**
     * 创建右下角的方向键和空格键
     */
    private void createRightBottomControls(int buttonSize, int largeButtonSize, int buttonMargin) {
        // 创建方向键容器
        FrameLayout directionPad = new FrameLayout(this);
        FrameLayout.LayoutParams padParams = new FrameLayout.LayoutParams(
                buttonSize * 3 + buttonMargin * 2,
                buttonSize * 3 + buttonMargin * 2);
        padParams.setMargins(0, 0, buttonMargin, buttonMargin);
        padParams.gravity = Gravity.BOTTOM | Gravity.RIGHT;
        mContainerLayout.addView(directionPad, padParams);

        // 创建上方向键
        ImageView upButton = createDirectionButton(buttonSize, android.R.drawable.arrow_up_float, KEYCODE_UP);
        FrameLayout.LayoutParams upParams = new FrameLayout.LayoutParams(buttonSize, buttonSize);
        upParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        directionPad.addView(upButton, upParams);

        // 创建下方向键
        ImageView downButton = createDirectionButton(buttonSize, android.R.drawable.arrow_down_float, KEYCODE_DOWN);
        FrameLayout.LayoutParams downParams = new FrameLayout.LayoutParams(buttonSize, buttonSize);
        downParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        directionPad.addView(downButton, downParams);

        // 创建左方向键
        ImageView leftButton = createDirectionButton(buttonSize, android.R.drawable.ic_media_previous , KEYCODE_LEFT);
        FrameLayout.LayoutParams leftParams = new FrameLayout.LayoutParams(buttonSize, buttonSize);
        leftParams.gravity = Gravity.CENTER_VERTICAL | Gravity.LEFT;
        directionPad.addView(leftButton, leftParams);

        // 创建右方向键
        ImageView rightButton = createDirectionButton(buttonSize, android.R.drawable.ic_media_next, KEYCODE_RIGHT);
        FrameLayout.LayoutParams rightParams = new FrameLayout.LayoutParams(buttonSize, buttonSize);
        rightParams.gravity = Gravity.CENTER_VERTICAL | Gravity.RIGHT;
        directionPad.addView(rightButton, rightParams);

        // 创建中间的空格键
        ImageView spaceButton = createEmptyButton(largeButtonSize, KEYCODE_SPACE);
        FrameLayout.LayoutParams spaceParams = new FrameLayout.LayoutParams(largeButtonSize, largeButtonSize);
        spaceParams.gravity = Gravity.CENTER;
        directionPad.addView(spaceButton, spaceParams);
    }

    /**
     * 创建方向按钮
     */
    private ImageView createDirectionButton(int size, int iconResId, final int keyCode) {
        ImageView button = new ImageView(this);
        button.setImageResource(iconResId);

        // 创建圆形背景
        GradientDrawable background = new GradientDrawable();
        background.setShape(GradientDrawable.OVAL);
        background.setColor(Color.argb(180, 50, 50, 50));
        background.setStroke(4, Color.argb(220, 255, 255, 255));
        button.setBackground(background);
        button.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        button.setPadding(size/4, size/4, size/4, size/4);

        // 设置触摸监听器
        setupButtonTouchListener(button, keyCode);
        return button;
    }

    /**
     * 创建文本按钮
     */
    private ImageView createEmptyButton(int size, final int keyCode) {
        // 使用ImageView作为基础，但实际项目中应该使用TextView或自定义视图
        // 这里简化实现，使用ImageView并设置内容描述
        ImageView button = new ImageView(this);

        // 创建圆形背景
        GradientDrawable background = new GradientDrawable();
        background.setShape(GradientDrawable.OVAL);
        background.setColor(Color.argb(180, 80, 80, 80));
        background.setStroke(4, Color.argb(220, 255, 255, 255));
        button.setBackground(background);
        button.setScaleType(ImageView.ScaleType.CENTER_INSIDE);

        // 在实际项目中，这里应该使用TextView或自定义视图来显示文本
        // 这里简化实现，使用一个带有文本提示的按钮

        // 设置触摸监听器
        setupButtonTouchListener(button, keyCode);
        return button;
    }
    /**
     * 创建文本按钮
     */
    private TextView createTextButton(int size, String text, final int keyCode) {
        // 使用ImageView作为基础，但实际项目中应该使用TextView或自定义视图
        // 这里简化实现，使用ImageView并设置内容描述
        TextView button = new TextView(this);
        button.setContentDescription(text);
        button.setText(text);
        button.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        button.setGravity(Gravity.CENTER);

        // 创建圆形背景
        GradientDrawable background = new GradientDrawable();
        background.setShape(GradientDrawable.RECTANGLE);
        background.setColor(Color.argb(180, 80, 80, 80));
        background.setStroke(4, Color.argb(220, 255, 255, 255));
        button.setBackground(background);

        // 在实际项目中，这里应该使用TextView或自定义视图来显示文本
        // 这里简化实现，使用一个带有文本提示的按钮

        // 设置触摸监听器
        setupButtonTouchListener(button, keyCode);
        return button;
    }

    /**
     * 设置按钮触摸监听器
     */
    private void setupButtonTouchListener(View button, final int keyCode) {
        button.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        // 按下效果
                        v.setAlpha(0.6f);
                        v.setScaleX(0.9f);
                        v.setScaleY(0.9f);
                        // 发送按键按下事件
                        sendKeyEvent(KeyEvent.ACTION_DOWN, keyCode);
                        return true;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        // 恢复效果
                        v.setAlpha(1.0f);
                        v.setScaleX(1.0f);
                        v.setScaleY(1.0f);
                        // 发送按键释放事件
                        sendKeyEvent(KeyEvent.ACTION_UP, keyCode);
                        return true;
                }
                return false;
            }
        });
    }

    /**
     * 发送按键事件
     */
    private void sendKeyEvent(int action, int keyCode) {
        long eventTime = System.currentTimeMillis();
        KeyEvent keyEvent = new KeyEvent(eventTime, eventTime, action, keyCode, 0);

        // 将事件分发给当前焦点视图或Activity
        View focusView = getCurrentFocus();
        if (focusView != null) {
            focusView.dispatchKeyEvent(keyEvent);
        } else {
            dispatchKeyEvent(keyEvent);
        }
    }

    @Override
    public void onBackPressed() {
        if (BuildConfig.BACK_BUTTON_QUITS) {
            if (mQuitDialog != null) {
                mQuitDialog.show();
            } else {
                super.onBackPressed();
            }
        } else {
            mPlayer.evaluateJavascript(TOUCH_INPUT_ON_CANCEL);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    protected void onStop() {
        super.onStop();
    }

    @Override
    protected void onPause() {
        mPlayer.pauseTimers();
        mPlayer.onHide();

        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        getWindow().getDecorView().setSystemUiVisibility(mSystemUiVisibility);
        if (mPlayer != null) {
            mPlayer.resumeTimers();
            mPlayer.onShow();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mPlayer.onDestroy();
    }

    @Override
    protected void onRestart() {
        super.onRestart();
    }

    private void createQuitDialog() {
        String appName = getString(R.string.app_name);
        String[] quitLines = getResources().getStringArray(R.array.quit_message);
        StringBuilder quitMessage = new StringBuilder();
        for (int ii = 0; ii < quitLines.length; ii++) {
            quitMessage.append(quitLines[ii].replace("$1", appName));
            if (ii < quitLines.length - 1) {
                quitMessage.append("\n");
            }
        }

        if (quitMessage.length() > 0) {
            mQuitDialog = new AlertDialog.Builder(this)
                    .setPositiveButton("Cancel", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            dialog.dismiss();
                        }
                    })
                    .setOnDismissListener(new DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(DialogInterface dialog) {
                            getWindow().getDecorView().setSystemUiVisibility(mSystemUiVisibility);
                        }
                    })
                    .setNegativeButton("Quit", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            WebPlayerActivity.super.onBackPressed();
                        }
                    })
                    .setMessage(quitMessage.toString())
                    .create();
        }
    }

    @SuppressLint("ObsoleteSdkInt")
    private static boolean addBootstrapInterface(Player player) {
        if (BuildConfig.BOOTSTRAP_INTERFACE && Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            new Bootstrapper(player);
            return true;
        }
        return false;
    }

    /**
     *
     */
    private static final class Bootstrapper extends PlayerHelper.Interface implements Runnable {

        private static Uri.Builder appendQuery(Uri.Builder builder, String query) {
            Uri current = builder.build();
            String oldQuery = current.getEncodedQuery();
            if (oldQuery != null && oldQuery.length() > 0) {
                query = oldQuery + "&" + query;
            }
            return builder.encodedQuery(query);
        }

        private static final String INTERFACE = "boot";
        private static final String PREPARE_FUNC = "prepare( webgl(), webaudio(), false )";

        private Player mPlayer;
        private Uri.Builder mURIBuilder;

        private Bootstrapper(Player player) {
            Context context = player.getContext();
            player.addJavascriptInterface(this, Bootstrapper.INTERFACE);

            mPlayer = player;
            mURIBuilder = Uri.fromFile(new File(context.getString(R.string.mv_project_index))).buildUpon();
            mPlayer.loadData(context.getString(R.string.webview_default_page));
        }

        @Override
        protected void onStart() {
            Context context = mPlayer.getContext();
            final String code = new String(Base64.decode(context.getString(R.string.webview_detection_source), Base64.DEFAULT), Charset.forName("UTF-8")) + INTERFACE + "." + PREPARE_FUNC + ";";
            mPlayer.post(new Runnable() {
                @Override
                public void run() {
                    mPlayer.evaluateJavascript(code);
                }
            });
        }

        @Override
        protected void onPrepare(boolean webgl, boolean webaudio, boolean showfps) {
            Context context = mPlayer.getContext();
            if (webgl && !BuildConfig.FORCE_CANVAS) {
                mURIBuilder = appendQuery(mURIBuilder, context.getString(R.string.query_webgl));
            } else {
                mURIBuilder = appendQuery(mURIBuilder, context.getString(R.string.query_canvas));
            }
            if (!webaudio || BuildConfig.FORCE_NO_AUDIO) {
                mURIBuilder = appendQuery(mURIBuilder, context.getString(R.string.query_noaudio));
            }
            if (showfps || BuildConfig.SHOW_FPS) {
                mURIBuilder = appendQuery(mURIBuilder, context.getString(R.string.query_showfps));
            }
            mPlayer.post(this);
        }

        @Override
        public void run() {
            mPlayer.removeJavascriptInterface(INTERFACE);
            mPlayer.loadUrl(mURIBuilder.build().toString());
        }
    }
}