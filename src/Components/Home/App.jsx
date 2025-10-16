// Todo List at homepage XD

// 1. Fix the background color of the navigation bar to be more transparent
// 2. Add smooth scrolling to the navigation links
// 3. Implement responsive design for mobile devices
// 4. Add animations to the skillset progress bars
// 5. Optimize images for faster loading times
// 6. Add a dark mode toggle
// 7. Improve accessibility by adding ARIA labels and roles
// 8. Add a footer section with social media links and copyright information
// 9. Implement form validation for the contact form
// 10. Add a loading spinner while the page is loading
// 11. Optimize the website for SEO

// Contents needed:
// 1.Homepage
// 2.About Page
// 3.Skillset Page
// 4.Project Page
// 5.Contact Page

import './App.css'
import "@fortawesome/fontawesome-free/css/all.min.css"
import NavigationBar from '../Navigation/App.jsx'
import logo from '../../Assets/icon/icon.png'

import profile from '../../Assets/img/Profile/profile-2.png'
import smk5 from '../../Assets/img/academy/bg.png'

import dr from '../../Assets/img/skill-set/dr.png'
import ae from '../../Assets/img/skill-set/ae.png'
import ps from '../../Assets/img/skill-set/ps.png'
import pr from '../../Assets/img/skill-set/pr.png'
import cc from '../../Assets/img/skill-set/cc.png'

import exjs from '../../Assets/img/skill-set/exjs.png'
import njs from '../../Assets/img/skill-set/njs.png'
import psql from '../../Assets/img/skill-set/psql.png'
import r from '../../Assets/img/skill-set/r.png'
import vjs from '../../Assets/img/skill-set/vjs.png'

import smk from '../../Assets/img/Profile/smk.png'
import rolling from '../../Assets/img/Profile/rolling.png'
import profil from '../../Assets/img/Profile/profil.jpg'

import poster500 from '../../Assets/img/Portofolio/500-Batang/Poster/poster-500.jpg'
import img1500 from '../../Assets/img/Portofolio/500-Batang/img-1.jpg'
import img2500 from '../../Assets/img/Portofolio/500-Batang/img-2.jpg'

import lcLogo from '../../Assets/img/Portofolio/Lenscapt/logo.png'
import lcBts2 from '../../Assets/img/Portofolio/Lenscapt/bts-2.jpg'
import lcBts3 from '../../Assets/img/Portofolio/Lenscapt/bts-3.jpg'
import lcBts1 from '../../Assets/img/Portofolio/Lenscapt/bts-1.jpg'
import lcDesign from '../../Assets/img/Portofolio/Lenscapt/design.png'

import ttPoster from '../../Assets/img/Portofolio/tabur-tuai/poster.jpg'

const Home = () => {
    return (
        <div className="home wrap" id='home'>
            <div className="content-wrap">
                <div className="home-img">
                    <img src={profile} alt="" className='profile-home'/>
                </div>
                <div className="home-paraf">
                    <div className="home-paraf-title">
                        <h1>Muhamad Rizky Ibrahim</h1>
                    </div>
                    <div className="home-paraf-subtitle">
                        <p className='subtitle-paraf'>Junior Fullstack Developer | Junior Cinematographer</p> 
                        <p className='description-paraf'>Saya Muhamad Rizky Ibrahim, biasa di panggil <i>Abim</i> dan sekarang saya mengulik banyak dunia mengenai <i>Cinematography, Web Development, Illustrator, dan Content Creator</i>. Saya Berumur 16 Tahun dan sedang Bersekola di <a><i>SMKN 5 Bandung</i>  dengan Jurusan <i>Broadcasting Dan Produksi Film</i></a></p>
                        <div className="wrap-btn">
                            <a href="#about" className='paraf-btn'>See More About Me</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const About = () => {
    return (
        <div className="about wrap" id='about'> 
            <div
                className="img-page-about"
                style={{
                    backgroundImage: `url(${smk5})`,
                    backgroundSize: "cover",
                    width: "100%",
                    height: "auto",
                }}
            >
                <div className="card-about">
                    <div className="cards-fix">
                        <div className="logos">
                            <img src={smk} alt="smk" />
                            <img src={profil} alt="profil" className='profil'/>
                        </div>
                        <h2>About Me</h2>
                        <p>Saya Bersekolah Di SMKN 5 Bandung Jurusan Broadcasting Dan Produksi Film, Saat ini saya masih Kelas 11 namun telah banyak mengikuti beberapa pengalaman dari beberapa Project Dari luar</p>
                        <div className="flex-about">
                            <a href="https://www.instagram.com/smknegeri5bdg/" target="_blank" className='next-btn smk'>See More About SMKN 5 Bandung</a>
                            <a href="https://www.instagram.com/smknegeri5bdg/" target="_blank" className='next-btn profil'>See More About Broadcastin And Film Production</a>
                        </div>
                    </div>
                    <div className="cards-fix-rolling">
                        <div className="logos">
                            <img src={rolling} alt="rolling" />
                        </div>
                        <h2>Rolling Production</h2>
                        <p className='rolling-paraf'>Sekarang saya berada di <i>Production House</i> Bernama <i><b>Rolling!</b></i></p>
                        <p className='rolling-paraf'>Rolling ini sebuah proggram dari <i>Broadcasting Dan Produksi Film</i> yang membuat sebuah <i>Rumah Produksi</i> Sebagai sebuah simulasi untuk membuat siswa memahami dunia bisnis media kreatif </p>
                        <div className="flex-about">
                            <a href="https://www.instagram.com/rollingproduction_/" target='_blank' className='next-btn rolling'>See More About Rolling</a>
                        </div>
                    </div>

                    <hr />
                    <p>Saya sering mengulik mengenai Proggraming, AI, Sinematografi, Illustrasi dan Memahami bagaimana Sebuah Komputer Bekerja. </p>
                    <p>Dalam Dunia Media Kreatif Dan Sinematografi saya memiliki bebe project nyata sebagai Behind The Scene, Videografer, Director Of Photography, Online Editor, Colorist dan Camera Person. Dalam Dunia Teknologi Saya Pernah Berparsitipasi dalam Company Profile Project Sebagai Junior Front End Developer</p>
                    <div className="wrap-btn">
                        <a href="#skillset" className='paraf-btn'>See My Skillset</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Skillset = () => {
    return (
        <div className="skillset wrap" id='skillset'>
            <div className="skillset-card">
                <p className='title-ss'>Skillset</p>
                <p className='paraf-ss'>Berikut ini adalah beberapa skill atau software yang saya kuasai sejauh ini dalam dunia Videography & Cinematography:</p>
                <div className="cine-skill-set">
                    <div className="cine">
                        <img src={dr} alt="dr"  width={100}/>
                        <p>Da Vinci Resolve</p>
                    </div>
                    <div className="cine">
                        <img src={pr} alt="pr"  width={100}/>
                        <p>Premiere Pro</p>
                    </div>
                    <div className="cine">
                        <img src={ae} alt="ae"  width={100}/>
                        <p>After Effect</p>
                    </div>
                    <div className="cine">
                        <img src={ps} alt="ps"  width={100}/>
                        <p>Photoshop</p>
                    </div>
                    <div className="cine">
                        <img src={cc} alt="cc"  width={100}
                            style={{
                                "borderRadius": '15px'
                            }}
                        />
                        <p>Capcut</p>
                    </div>
                </div>
                <p className='paraf-ss'>Dan Berikut ini adalah beberapa skill atau software yang saya kuasai sejauh ini dalam dunia Technology</p>
                <div className="cine-skill-set">
                    <div className="cine">
                        <img src={r} alt="r"  width={100}
                            style={{
                                "borderRadius": '15px'
                            }}
                        />
                        <p>React JS</p>
                    </div>
                    <div className="cine">
                        <img src={exjs} alt="ex"  width={100}
                            style={{
                                "borderRadius": '15px'
                            }}
                        />
                        <p>Express JS</p>
                    </div>
                    <div className="cine">
                        <img src={njs} alt="ex"  width={100}
                            style={{
                                "borderRadius": '15px'
                            }}
                        />
                        <p>Next JS</p>
                    </div>
                    <div className="cine">
                        <img src={vjs} alt="vjs"  width={100}
                            style={{
                                "borderRadius": '15px'
                            }}
                        />
                        <p>Vite JS</p>
                    </div>
                    <div className="cine">
                        <img src={psql} alt="psql"  width={100}
                            style={{
                                "borderRadius": '15px'
                            }}
                        />
                        <p>Postgre Sql</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Project = () => {
    return (
        <div className="project wrap" id='project'>
            <div className="pr-container">
                <div className="pr-title">
                    <p className='t1'>My Project</p>
                    <p>Ini beberapa projek yang 'besar' yang pernah saya kerjakan</p>
                </div>
                <div className="pr-wrap">
                    <div className="cards-pr start">
                        <div className="img-pr">
                            <img src={poster500} alt="" width='300px'/>
                        </div>
                        <div className="paraf-pr">
                        <h3>500 Batang</h3>
                            <p>Di kelas 11 ini kita membuat sebuah film gabungan dari beberapa PH yaitu Rolling, Oceara dan Vismaya, biasa dipanggil ROV berjudul 500 Batang. Bercerita mengenai seorang Gadis yang kesal dengan Kakaknya yang dihidupnya hanya merokok, bermain game dan judi online. </p>
                            
                            <p>Dalam film pertama saya ini saya banyak belajar mengenai Sinematografi, terutama dari segi Komposisi, Lighting, Camera movement, Seninya Visual Story Telling, Color Theory, dan banyak lainnya sebagai inti dari sinematografi itu sendiri.</p>
                            <p>Di Project ini saya menjadi</p>
                            <ol>
                                <li>Director Of Photography</li>
                                <li>Editor Online</li>
                                <li>Colorist</li>
                            </ol>
                        </div>
                    </div>
                    <div className="text-gallery-pr">
                        <h2>This Is My Little Gallery On This Project</h2>
                    </div>
                    <div className="gallery-pr">
                        <img src={img1500} alt="" />
                        <img src={img2500} alt="" />
                    </div>
                    <div className="cards-pr end">
                        <div className="img-pr">
                            <img src={ttPoster} alt="" width='300px'/>
                        </div>
                        <div className="paraf-pr-end">
                            <h3>Tabur Tuai</h3>
                            <p>Di kelas 10 ini saya diajak membuat sebuah film sebagai BTS <i>Behind The Scene</i> di film berjudul Tabur Tuai ini, Berceritakan seorang mahasiswa yang sering kedukun untuk mendapatkan uang yang dipakai foya-foya</p>
                            <p>Dari film ini saat kelas 10 saya mendapatkan banyak pengalaman mengenai Produksi film terutama beberapa poin dalam sinematografi lalu saya mencoba untuk menerapkannya pada film saya berjudul 500 Batang</p>
                            <p>Di Project ini saya menjadi seorang BTS</p>
                        </div>
                    </div>
                    
                    <div className="cards-lc center">
                        <div className="img-lc">
                            <img src={lcLogo} alt="" width='100px'/>
                        </div>
                        <div className="paraf-lc">
                            <h3>Lenscapt</h3>
                            <p>Di Kelas 10 ini kita membuat sebuah pameran fotografi yang biasa disebut <i>Lenscapt</i>, Lenscapt ini sebuah pameran fotografi yang kita dirikan untuk pertama kali dalam angkatan Broadcasting Dan Produksi Film Ini</p>
                            <p>Dalam Projek ini saya menjadi seorang Ketua Pelaksana untuk pertama kalinya dan menjadi pengalaman yang sangat amat berharga</p>
                        </div>
                    </div>
                    <div className="text-gallery-pr">
                        <h2>This Is My Little Gallery On This Project</h2>
                    </div>
                    <div className="gallery-pr">
                        <img src={lcBts1} alt="" />
                        <img src={lcBts2} alt="" />
                        <img src={lcBts3} alt="" />
                    </div>
                </div>
            </div>
        </div>
    )
}

const Foot = () => {
    return (
        <>
        <div className="footer wrap">      
            <div className="foot cc">
                <div className="foot title">
                    <img src={logo} alt="Logo" className='img-icon' width='120px'/>
                    <div className="subparaf">
                        <h2 style={{
                            "margin": 0
                        }}>Rsgas</h2>
                        <i style={{ "margin": 0}}>Muhamad Rizky Ibrahim</i>
                    </div>
                </div>
                <div className="paraf-foot">
                    <h1>Try Contact Me!</h1>
                    <ol>
                        <li><a target='_blank' href="https://www.instagram.com/unholybim/">Instagram</a></li>
                        <li><a target='_blank' href="https://github.com/rsgas">Github</a></li>
                        <li><a target='_blank' href="https://wa.me/62895354070008">Whatsapp</a></li>
                    </ol>
                </div>
            </div>
        </div>
        <div className="copyright">
            <a href="https://github.com/rsgas/rsgas?tab=MIT-1-ov-file" target='_blank'>© Copyright 2025 - RSGAS - All Right Reserved</a>
        </div>
        </>
    )
}


const Main = () => {
    return (
        <>
            <div className="wrap-nav">
                <NavigationBar/>
            </div>
            <div className="main-parrents">
                <Home/>
                <About/>
                <Skillset/>
                <Project/>
                <Foot/>
            </div>
        </>
    )
}

export default Main
