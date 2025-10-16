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
                    <p>My Project</p>
                    <p>Ini beberapa projek yang 'besar' yang pernah saya kerjakan</p>
                </div>
                <div className="pr-wrap">
                    <div className="cards-pr start">
                        <img src="" alt="" />
                    </div>
                </div>
            </div>
        </div>
    )
}

const Contact = () => {
    return (
        <div className="contact wrap" id='contact'>
            <h1>Hello World From Contact</h1>
        </div>
    )
}

const Foot = () => {
    return (
        <div className="foot wrap">      
            <h1>Hello World From Foot</h1>
        </div>
    )
}


const Main = () => {
    return (
        <>
            <div className="wrap-nav">
                <NavigationBar/>
            </div>
            {/* <div className="closed-gap">
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
            </div> */}
            <div className="main-parrents">
                <Home/>
                <About/>
                <Skillset/>
                <Project/>
                <Contact/>
                <Foot/>
            </div>
        </>
    )
}

export default Main
