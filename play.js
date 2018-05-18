"use strict";

var game;
var ais;
var aiDelay = 1000;
var paused = false;

$(function () {
    ais = {};
    ais[Ttt.X] = null;
    ais[Ttt.O] = null;

    var $board = $('#board');
    var $status = $('#status');
    var $difficultyControl = $('#difficulty-control');
    var $pauseButton = $('#pause');
    var $stepButton = $('#step');
    var $undoButton = $('#undo');
    var $restartButton = $('#restart');

    var boardCtx = $board[0].getContext('2d');
    var aiTimerId = undefined;

	boardCtx.canvas.width  = Math.min(500, $("#play-area").width());
	boardCtx.canvas.height = Math.min(500, $("#play-area").width());
  
    restart();

    function restart() {
        game = new Ttt.Game();
        update();
    }

    function update() {
        cancelAiMove();

        redraw();

        switch (game.winner()) {
        case Ttt.X: $status.text($status.data('winner-x')); break;
        case Ttt.O: $status.text($status.data('winner-o')); break;
        case Ttt.TIE: $status.text($status.data('tie')); break;
        default:
            if (ais[game.turn] && paused) {
                $status.text($status.data('paused'));
            }
            else {
                clearStatus();
            }
            break;
        }

        $pauseButton.val($pauseButton.data(paused ? 'paused' : 'unpaused'));

        scheduleAiMove();
    }

    function clearStatus() {
        $status.text($status.data('empty'));
    }

    function redraw(highlightPiece) {
        game.draw(boardCtx, $board.width(), $board.height(), 0, 0, highlightPiece);
    }

    function setPaused(p) {
        if (p !== paused) {
            paused = p;
            update();
        }
    }

    function move(square) {
        game.move(square);
        update();
    }

    function undo() {
        if (game.history.length > 0) {
            game.undo();
            update();
        }
    }

    function scheduleAiMove() {
        if (typeof aiTimerId === 'undefined' && game.winner() === 0 && ais[game.turn] && !paused) {
            aiTimerId = window.setInterval(makeAiMove, aiDelay);
            $status.text($status.data('thinking'));
        }
    }

    function cancelAiMove() {
        if (typeof aiTimerId !== 'undefined') {
            window.clearInterval(aiTimerId);
            aiTimerId = undefined;
            clearStatus();
        }
    }

    function makeAiMove() {
        cancelAiMove();

        if (ais[game.turn] && game.winner() === 0) {
            var square = ais[game.turn].getMove(game);
            if (game.getPiece(square) !== 0) {
                throw new Error(
                    "AI chose invalid move " + square.toString()
                    + " in " + game.toString()
                );
            }
            move(square);
        }
    }

    function setAi(turn, ai) {
        ais[turn] = ai;
        update();
    }

    function setAiFromSelect(turn) {
        var ai = null;
		if (turn === Ttt.X) {
			switch ($difficultyControl.val()) {
			case '0': ai = new Ai.Random(); break;			
			case '1':
				var obj = $.parseJSON(thr);
				var net = Neural.Net.import(obj);
				ai = new Ai.Neural(net);
				break;
			case '2': ai = new Ai.Smart(1); break;
			case '3': ai = new Ai.Smart(); break;
			}
		}
        setAi(turn, ai);
    }

    function getSquare(x, y) {
        var col = (x - $board.offset().left) / $board.width() * 3 | 0;
        var row = (y - $board.offset().top) / $board.height() * 3 | 0;
        return col + row * 3;
    }

    $board.mousemove(function (event) {
        if (!ais[game.turn] && game.winner() === 0) {
            redraw(getSquare(event.pageX, event.pageY));
        }
    });

    $board.mouseleave(function (event) {
        if (!ais[game.turn] && game.winner() === 0) {
            redraw();
        }
    });

    $board.click(function (event) {
        var square = getSquare(event.pageX, event.pageY);
        if (!ais[game.turn] && game.winner() === 0 && game.getPiece(square) === 0) {
            move(square);
        }
    });

    $difficultyControl.change(function (event) {
        setAiFromSelect(Ttt.X);
    });

    $pauseButton.click(function (event) {
        setPaused(!paused);
    });

    $stepButton.click(function (event) {
        makeAiMove();
    });

    $undoButton.click(function (event) {
        undo();
    });

    $restartButton.click(function (event) {
        restart();
    });
	
	setAiFromSelect(Ttt.X);

});

var thr = '{"thresholds":[[0.0492735354681173,-1856.5743371216502,2163.000767839857,-2165.9900527253567,0.47947063898377706,0.8583108825352923,3522.7498380952957,6215.072114656742,0.26051607579880454,-890.30181886457,-377.6348510102265,0.9978950569884901,0.3931809265491353,1543.1951028345004,-432.29986032467156,-103.52863392841692,0.6169019905935755,0.3248351968174177],[-1015.9250887656049,569.3992835551728,-275.25819544259167,-2335.9111126213197,4208.106344760039,1100.7267801671298,688.4204522002751,50.10265532583388,279.325847424869,2155.589250257844,300.73361940514025,-2039.5426837500336,-536.7580665637895,-92.56236275591047,-1237.30067748858,961.7008621663995,5471.562865968438,-2242.6824074309725,547.2765061446252,303.5909377446824,-3131.035392758121,-940.1571689914629,-78.81028954433754,576.6213338971728,1346.8362359352193,2101.017685167208,-1928.1789871189196],[-344.71707884399837,802.7271077936263,-20.2087298753152,1918.5543040216205,-1074.213273043948,-198.3571331658177,-386.02449316793684,283.6664990079606,-376.9457597521897],[null]],"weights":[[[-12.953671551655876,264.9127714080059,-50.706014118024015,-83.72219261888618,44.728184585939076,-265.7344059045428,90.52363421629133,-344.46501959024084,-214.80493335648205,15.00581920646884,-467.81416732565066,-199.3550692995727,250.8472407817386,189.00127081080666,-757.6995376160222,144.23120497427098,-88.9326089529905,-149.89909567583766,-60.592478078244156,432.70400146759465,344.7641507327215,98.98745145865185,-415.69853305450937,200.38396693394617,-222.36837911693738,-243.7878612764508,-179.53127704635412],[-234.3592699633669,-49.38964338322009,404.58335766020303,-134.82779362811166,-67.35998719772121,247.54373064442194,2.3199313977772995,-310.36663655817244,1.6026251534398943,198.2941827223137,-438.185434409232,-153.1104670775776,-466.7335753806334,241.26921254182773,1.3671791383551755,207.26595513086704,-23.674088256512928,-302.06989218060966,196.4803807632639,127.57389513104832,-35.55353421916716,134.83563504821174,92.9381837160137,-20.673076401699873,1.39561300019541,122.51388107509425,-244.61257705584057],[81.07814890709233,66.93232929577479,-366.35000431858003,63.8575210523906,-174.45567085337962,165.14920005204556,407.22841558939774,-4.240561274288588,-27.833851334981524,147.5979555313823,425.03866212700217,183.8267090849412,575.9582700533906,-27.06902387082096,-121.73711157789923,473.08329258711905,-83.46476843106531,394.3562114529338,-261.4261249687737,74.3043685173433,-393.86916803312727,79.59713336043905,279.5189129565775,210.59721617841126,46.20945233797324,277.14557083994777,-105.65588185810341],[-12.325681536517575,78.90218151480939,599.575277907459,10.789976270756997,347.010689697889,217.16142588116188,-33.35308382541244,-53.49896684716499,-154.1439925542987,468.64186124734005,150.39113326574108,103.87540783873034,214.7543823445944,-48.55689749992249,-40.288074082980366,-34.889188595408996,-370.4791852099181,-62.91976154100754,90.0210615626546,112.91411182891909,400.877886479212,311.1695272151885,351.42123673807544,244.05682384476955,34.931508939081624,-183.28115110456707,-218.95551829429746],[-354.8043589519334,-111.18886634566854,-439.5047269701875,10.356160898543484,263.5003444644817,-258.61413855227937,51.797298157991165,246.12632891280487,-387.59684429183454,-436.7414707328232,52.99578563805101,-196.12674310384554,196.43463730043854,-108.33985362105668,261.70856537611854,-605.3433569412651,256.4452893938678,-15.146663745126183,-331.0833701510241,-181.14519350706428,29.12502839268429,146.80569725494522,70.16910450924583,31.614389970888272,388.5600942610788,222.61842112677977,581.7540075394193],[135.3226618693677,-53.30821311290999,58.06057054521932,319.78644376866,-200.56465599078314,266.67993600986154,-450.3565055675002,-25.86902197518595,66.67586699758357,-229.15688297351238,-258.6473810175744,-8.322529863927903,223.68451128917198,463.2909544527653,234.23187259846165,-174.0616261481822,-351.49905623722043,83.14528624581527,-142.9739342940263,-154.19204105950277,-307.73979254457,159.4901621315098,-39.33771139123975,127.06569213767793,58.7076041184433,291.79992128022826,520.5813441440969],[302.32801013313843,-342.56176841366215,239.90186418368125,-343.38664708838974,344.79240778877124,122.25852680260284,-24.30245317392457,-369.69382675876295,-363.7581829106698,-362.0670493648578,-107.87160778075254,-243.63775578987466,250.23017263512318,56.65791967727669,-148.40268783564153,85.01225539764064,211.1416657280856,219.4029123758337,-187.25146144616284,291.25729751421585,3.464649381125521,69.64841239281502,-21.64839718137341,7.768907389757791,8.97445913011111,-219.32402826812995,11.336830981004208],[547.2891792789707,-128.06316221709838,-311.42531389423215,-186.54554138627944,-151.25336661744896,-204.1421029148533,385.2735722757556,341.1021032223473,-406.1689676048002,31.279347483931705,-240.82197689868133,177.11288663706702,-312.2265629484899,38.27985530815823,57.37460014714961,409.2324474463893,87.1429899687227,357.2722441483824,-440.76848206301764,-250.18965520549452,390.2851892361785,193.19651629238749,129.24908270385217,315.74335479224555,-444.9732817571709,195.43718735507474,-155.82470996858592],[184.59129602182844,292.19221102313355,-29.780651476893453,-401.3659967419416,-132.93546225423708,207.91903886385438,35.22990603186161,130.61080105218932,61.18750179296118,202.52599318350866,-560.3588728453708,-204.25281851604342,21.127437871697573,-331.65839378113674,-193.3325888287502,-66.13207957283348,9.651664297639401,84.78189407565293,-344.46223344635274,-479.5040011200203,-199.2617021043844,41.46028770583551,-87.61086551606478,-93.65170309626498,-196.1751114089195,-65.87428990603325,356.1440490430784],[385.049760721089,-42.37150976831655,-185.7308634473258,-104.20191773307893,-126.73951629228347,-13.713761584545976,-393.0674195376207,8.971877307240241,-328.5447996776835,450.54533485791274,361.6694863305644,-128.0186388513613,32.66981277021274,-173.11257548012745,40.382789082934764,325.2134023660892,45.41062566218521,334.48851859020914,-41.28649015085061,202.18987167713084,-551.2393632634502,-512.3681251346771,-366.58163746340193,33.22114176059235,-262.3405310748711,-279.0364991001793,-169.17088375712896],[155.24947076286253,-105.69826669128244,-212.52943594875046,-564.3699116430176,-258.7055195825958,85.55196549949716,-234.10670435532353,-17.982984773110818,-82.90325779796113,177.64321034814216,26.316930216370746,-407.60949843639503,96.3791507703005,475.1675306678856,-36.17414471795958,-61.330785516882955,-166.56534483995762,64.6071109612403,60.188775509213734,31.305180651721304,24.142112175180856,326.7072705756867,296.79753641393563,129.83621600528977,539.7149936867218,-437.04684002709575,140.67968081550404],[-308.431537267139,-190.3602201453957,168.54936783703616,16.77988978893241,-373.91698268352167,-232.68422475655785,-130.78668483533897,91.51936219512693,141.61355241793402,165.70502214405136,-441.445142475354,-223.88125580334793,322.5439162927094,347.8686491663058,-8.041443271277133,-162.13406664065351,-20.837086445071627,181.72957333853583,55.45551348477695,275.35296514973123,-83.18467213827401,-223.95586660586372,-293.6115958936281,-49.46165339008609,-388.87093245064204,331.71109239947276,-172.38036915124204],[149.0108631192414,-26.410108400990968,-84.05426741260585,-402.64164922995695,-156.95037120932807,620.8762151896979,225.2081426232091,129.85196322588592,356.30503482719325,309.8123883167567,-346.46003106464457,-208.525324739527,364.43556095965937,637.1296452591944,263.91309229885303,101.18699553100156,165.01659337831217,-245.4384071433748,133.1548624761466,-526.1724411960364,-339.5503837194192,-215.26382286970997,-38.03285464277285,-38.15800532012673,-70.22243052447268,-79.21982541010995,-294.77319560485984],[290.75761555884884,-192.03766495583116,280.2776697681511,100.51554833920727,-51.84463475194771,-0.6675258993568844,-132.55186518862493,376.4480685269068,-27.255338695732057,75.24685814369892,347.6210951719056,267.6244470113571,-299.2621257544045,436.9409619456573,-555.3691785354298,-190.24391056890934,-510.3214161308196,209.70127597376904,296.25192614838386,23.494660025506718,19.293411630548132,-61.46805662429678,-223.03549210844585,379.42956877540814,-53.21063416457812,97.74676384122648,28.178419010956286],[-2.495835489562472,88.29175058539711,-433.41417417541146,-272.51906745171,64.97748104402012,-10.905416658473905,-240.8360955091247,325.23210157832494,418.7269049412313,-159.72681908391934,403.1641834100444,-13.623083512773523,-269.86821197239306,-525.4452511943299,-346.20471288586486,27.735649603838457,-370.99869264951445,406.2481816966164,303.8178316131412,165.91028702720885,-170.2885575936395,198.15453173023616,-617.234897124981,-325.78347556720036,-169.2353834180712,-386.14956166228933,-209.16771519136506],[-30.62988950988944,-52.98739140335759,-298.1452323188495,132.63352900450587,304.42996326583614,5.5904875486648375,212.24072105030473,110.64338760633169,261.9469150285394,-404.7228522524675,121.11072086642463,-236.01319700409488,-42.7580077083614,-397.92372008247736,-406.06393683775883,382.7309238334545,-34.97653341072259,-56.57668854276493,-249.93608934391023,-301.6963617460499,-22.43035505596455,23.35407273149393,183.04531365642936,-204.1427605241692,357.502563630604,-176.30519192256114,58.26534058333973],[-415.51599226001906,-16.46334154471109,-19.846276583059932,-86.632822455731,-297.62376380807126,-1.088249960247479,154.50022330143963,-328.81433686095096,-2.8189534168923203,97.88490079486274,468.5808987273611,-122.22579860001979,316.30748463601526,77.12574883277274,368.1852047157042,-165.0007394539285,273.3319366720551,-87.53230860720636,-195.14468600197003,-205.9826352596755,497.573349767774,46.781191232432306,-381.9512700967045,-192.3232550536339,307.5008143914168,-22.384720450206807,478.27335288159634],[332.47127607074077,7.629995579798342,106.15210728279644,87.35520787230107,-351.38768177023434,74.00673424647536,-192.59437006870365,-16.75039914824633,31.35755294765842,-61.578019503160704,36.42532766497317,-229.52217489772806,21.9419989450328,-177.3896302574398,-18.742523249625993,337.35608675328393,302.49421231374777,197.6737444461139,83.85490846773402,-172.07472452863016,57.83262165122807,359.2284027787108,102.6730168877082,-14.800469979075645,-39.223679938142496,-86.43269704375538,157.1834836999491]],[[-33.20420733922067,-3.0111043273549623,-412.19645828388013,314.1625989877153,-179.3095602990696,-240.31950866537068,-8.807820594158812,-280.40662502423504,297.25509668598346],[93.60818991540089,-416.24586236094575,-265.9979644716174,-12.296725306707902,517.8450013276839,43.498838013700414,-221.8025020130404,-212.41490304372354,-401.4166625358027],[123.94860099820765,-234.96923481451853,366.17189439580227,-303.15947439281905,121.81472874829771,-288.32231581818735,388.45146772313115,431.1481261741938,-319.7331608011888],[331.5303729656293,-241.2869535656308,567.3234870890087,650.299280123575,79.29512241519566,-200.04543273875208,-500.01975028589544,185.7612169027979,-80.30997736763068],[40.72974977214406,363.55355855616125,-12.727829545459812,-334.21439208434214,19.191765541488877,-445.2306294073781,175.6155693525313,-168.18316408052522,-306.94704451538735],[501.71703313939895,253.02044492704815,52.202687920119814,204.3587070686717,-117.39610329894629,271.47781344747733,-75.91515586373413,452.0934723572278,178.21527386395073],[-11.81138779621633,67.70402832023592,-16.795742279979237,69.00227014064993,-54.99442489411018,393.00831648442403,178.26736401309006,-169.94084897193648,-112.50230856578052],[-415.8034457921985,207.68290254071312,546.8577384630221,188.86388059697924,-340.33433013345456,-186.08708448301698,335.281940533275,-74.83813992647131,36.4575978173399],[343.27601043593694,578.5712532087151,-313.3862900853376,317.60190340786664,202.80310094239266,363.4419267587419,49.24096170172908,86.34138762086413,268.2021915112177],[28.850708715268862,335.94348871133604,-159.20430045195494,305.7903307981905,-206.84129043002082,-17.122989432443887,392.01089432157937,-444.50756643668706,-149.20162641262328],[-61.750743071003825,-58.751433450679556,521.3124624187113,-375.89156675419235,-122.42070072111076,121.50791522840896,-349.7850480067003,458.2812778699619,-237.589553725837],[250.2694487450142,134.832557988607,-188.38494492846937,-135.5175609314477,-220.0807567448275,44.60842118006612,63.82844554859914,-295.1122882560935,-43.62704634268196],[410.0946660563086,-297.5959570820248,-219.78681863091393,-86.2415932992384,191.7963301753837,-84.91433774841366,-166.8691211574889,-83.4248275379451,-134.56219148877562],[-73.98235764470918,365.6638103389405,-34.5695521662154,-306.3851399971234,-442.41209273266963,-260.820110617998,131.83902282295276,241.07100143959158,-85.25015860917327],[-227.1807551911841,-82.35273898524825,-465.8206846659912,-291.729870599737,261.054641586343,-498.05078014834106,231.11836238379112,14.599274376870166,-55.148957201287104],[215.6485022214426,84.51081905586851,181.47591782184142,22.22158228606279,-111.32780254996035,-247.136325895653,17.25184670852607,-345.78128124367555,-165.56300811867274],[-233.17129947580304,-242.90283524658727,499.32828519983605,-21.27665232155846,68.13141021561708,126.47598689806485,46.43865710103558,-381.23916111637493,-44.28083735178807],[-445.06793013089066,60.578569989607374,376.04106405303315,283.99394482515453,-517.0751362612971,437.66672268995603,-365.76954846794945,-77.98689677806468,255.92335719238073],[37.82839981298087,310.7678079145209,367.0576865822186,223.83313716296664,-35.17047173337131,-316.28078824270125,101.10584817379721,-263.78275691561464,-25.40113615282737],[-461.5439059145916,-271.72182287966405,329.43542841500596,-27.560628469337377,-597.0801266014482,86.94182133982893,-364.710731746075,434.47739798475754,-193.03294419508273],[-274.1811027059586,230.2503851919301,-430.8872978023395,6.80698323228325,-202.80984268785429,263.5562700382254,101.08862247410411,-202.02864061977948,6.009955862458374],[-92.59038243060773,-18.42908391715586,140.18211264170768,-415.5240559982185,-158.5071920386711,10.264074076002135,17.09793863742168,36.35723244136762,125.86625478136841],[-294.60095195185767,184.7295366089137,86.57202254833399,-250.29673089945263,500.51435246366646,-783.2980123520241,-208.9391000570985,474.89745837653766,30.710743425470447],[-187.2278906721858,-14.677279318257044,-214.57334729247162,-270.5193773137456,-74.59046045815262,283.1802781299957,27.135791783358552,92.41302514172115,-20.65734806165708],[-718.8806064522082,-106.55987786170036,-333.0312020943818,124.1059637992864,-110.17254869332808,19.50023765812618,-68.98028367765764,8.876025447386116,-78.50086476108787],[418.75847417276486,-84.79691023250457,-51.39531337657314,-181.30581420385755,-168.44874380920052,-221.20905897243267,376.4044786186158,185.8790180672285,-144.80576776310357],[-40.2491982977933,-327.94110848806423,-396.49103931869314,76.12596502823646,44.7211671643746,58.03322933125761,-56.81614265768235,-462.4541167328802,-919.7394069158419]],[[-55.174005398579986],[-287.25352651342973],[-213.409818461781],[-309.89445020911336],[140.81942951106257],[245.31158607678975],[66.34810612047659],[-115.30811281817523],[343.4047783442741]],[[]]]}';
