package systems.altimit.rpgmakermv;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.os.Environment;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class FileSystemInterface {
    private Context context;
    private WebView webView;
    private File baseDir;

    public FileSystemInterface(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;

        // 获取 Android/data/com.package.name/files 目录
        this.baseDir = context.getExternalFilesDir(null);
        if (this.baseDir == null) {
            // 如果外部存储不可用，使用内部存储
            this.baseDir = context.getFilesDir();
        }
    }

    // 将用户路径转换为安全路径（限制在应用目录内）
    private File getSafeFile(String path) {
        // 移除开头的斜杠和点
        String cleanPath = path.replaceFirst("^[./]+", "");

        // 创建相对于 baseDir 的文件
        File file = new File(baseDir, cleanPath);

        try {
            // 获取规范化路径
            String normalizedPath = file.getCanonicalPath();

            // 确保路径不会跳出应用目录
            if (!normalizedPath.startsWith(baseDir.getCanonicalPath())) {
                // 如果尝试跳出应用目录，返回 null 或 baseDir
                return baseDir;
            }

            return file;
        } catch (IOException e) {
            e.printStackTrace();
            return baseDir;
        }
    }

    // 读取文件
    @JavascriptInterface
    public String readFileSync(String path, String encoding) {
        try {
            File file = getSafeFile(path);
            if (!file.exists()) {
                return null;
            }

            FileInputStream fis = new FileInputStream(file);
            byte[] data = new byte[(int) file.length()];
            fis.read(data);
            fis.close();

            if (encoding.toLowerCase().equals("utf-8") || encoding.toLowerCase().equals("utf8")) {
                return new String(data, StandardCharsets.UTF_8);
            } else {
                return new String(data);
            }
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    // 写入文件
    @JavascriptInterface
    public boolean writeFileSync(String path, String data) {
        try {
            File file = getSafeFile(path);
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }

            FileOutputStream fos = new FileOutputStream(file);
            fos.write(data.getBytes(StandardCharsets.UTF_8));
            fos.close();
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    // 检查文件是否存在
    @JavascriptInterface
    public boolean existsSync(String path) {
        File file = getSafeFile(path);
        return file.exists();
    }

    // 读取目录
    @JavascriptInterface
    public String readdirSync(String path) {
        File dir = getSafeFile(path);
        if (dir == null || !dir.exists() || !dir.isDirectory()) {
            return null; // 返回null，让JavaScript抛出错误
        }

        String[] list = dir.list();
        if (list == null) {
            list = new String[0];
        }

        // 构建JSON数组字符串，手动转义字符串中的特殊字符
        // 注意：这里我们添加".."作为第一个元素
        StringBuilder json = new StringBuilder("[");
        boolean isFirst = true;
        for (String file : list) {
            if(!isFirst){
                json.append(",");
            }
            else{
                isFirst = false;
            }
            // 对每个文件名进行JSON转义
            json.append(escapeJSON(file));
        }
        json.append("]");
        return json.toString();
    }

    // 简单的JSON字符串转义
    private String escapeJSON(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder();
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '/': sb.append("\\/"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int)c));
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        sb.append('"');
        return sb.toString();
    }

    // 创建目录
    @JavascriptInterface
    public boolean mkdirSync(String path) {
        File dir = getSafeFile(path);
        if(dir.exists()){
            return false;
        }
        return dir.mkdirs();
    }

    // 删除文件
    @JavascriptInterface
    public boolean unlinkSync(String path) {
        File file = getSafeFile(path);
        return file.delete();
    }

    // 删除文件
    @JavascriptInterface
    public boolean rmdirSync(String path) {
        File dir = getSafeFile(path);
        return dir.delete();
    }
    // 获取文件信息
    @JavascriptInterface
    public String statSync(String path) {
        File file = getSafeFile(path);
        if (!file.exists()) {
            return null;
        }

        // 返回 JSON 字符串
        return String.format("{\"_isFile\":%b,\"_isDirectory\":%b,\"size\":%d,\"mtime\":%d}",
                file.isFile(),
                file.isDirectory(),
                file.length(),
                file.lastModified());
    }

    // 新增：获取应用数据目录路径
    @JavascriptInterface
    public String getAppDataPath() {
        return baseDir.getAbsolutePath();
    }

    // 新增：获取绝对路径（仅供调试用）
    @JavascriptInterface
    public String getFullPath(String path) {
        File file = getSafeFile(path);
        return file.getAbsolutePath();
    }
}