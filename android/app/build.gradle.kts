// Coremon para Android: una WebView a pantalla completa que carga el juego
// (index.html, css/, js/, icons/ de la raíz del repo) desde los assets del APK.
plugins {
    id("com.android.application")
}

// Firma de release: variables de entorno (o secretos de GitHub Actions).
// Sin ellas, el APK se firma con la clave de depuración y sigue siendo instalable.
val keystorePath: String? = System.getenv("COREMON_KEYSTORE")
val hasReleaseKey = keystorePath != null && file(keystorePath).exists()

android {
    namespace = "com.acorik.coremon"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.acorik.coremon"
        minSdk = 23
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1"
    }

    signingConfigs {
        create("release") {
            if (hasReleaseKey) {
                storeFile = file(keystorePath!!)
                storePassword = System.getenv("COREMON_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("COREMON_KEY_ALIAS") ?: "coremon"
                keyPassword = System.getenv("COREMON_KEY_PASSWORD") ?: System.getenv("COREMON_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName(if (hasReleaseKey) "release" else "debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/web"))
}

// Copia el juego web dentro de los assets en cada compilación
val copyWeb by tasks.registering(Sync::class) {
    from(rootProject.file("..")) {
        include("index.html", "manifest.webmanifest", "css/**", "js/**", "icons/**")
    }
    into(layout.buildDirectory.dir("generated/web/www"))
}
tasks.named("preBuild") { dependsOn(copyWeb) }

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
