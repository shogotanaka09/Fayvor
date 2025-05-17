import imagemin from 'imagemin-keep-folder'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import imageminWebp from 'imagemin-webp'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminSvgo from 'imagemin-svgo'

const inDir = 'src/img/**/*.{jpg,png}'

const convertWebp = (targetFiles) => {
  imagemin([targetFiles], {
    plugins: [imageminWebp({ quality: 95, method: 6 })],
    replaceOutputDir: (output) => {
      return output.replace(
        /img\//,
        `../public/assets/img/`
      )
    }
  })
}
imagemin(['src/img/**/*.{jpg,png,gif,svg}'], {
  plugins: [
    imageminMozjpeg({ quality: 85 }),
    imageminPngquant({ quality: [0.7, 0.85] }),
    imageminGifsicle(),
    imageminSvgo()
  ],
  replaceOutputDir: (output) => {
    return output.replace(
      /img\//,
      `../public/assets/img/`
    )
  }
})
  .then(() => {
    convertWebp(inDir)
  })
  .then(() => {
    console.log('Images optimized')
  })
