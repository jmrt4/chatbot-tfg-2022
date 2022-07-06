// Declaración de requerimientos
const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Conocimiento = require('./models/conocimiento');
const Acceso = require('./models/acceso');
const { db } = require('./models/conocimiento');
const moment = require('moment');

// Preparamos los datos de conexion con la BBDD
const usuario = 'node';
const contrasenya = '46vV2xLlLOG5Q1JJ';
const nombrebd = 'coch_conocimiento_chatbot';
const enlace = 'mongodb+srv://' + usuario + ':' + contrasenya + '@dialogflowcluster.3akpo.mongodb.net/' + nombrebd + '?retryWrites=true&w=majority';

// Preparamos los datos del envio de emial
const remitente = 'dialogflowtfg2022@gmail.com';
const contrasenyaEmail = ']*zXV=Vrv3Kc]g7e';
const destinatario = 'jmrt4@gcloud.ua.es';
const asunto = 'Introducción de nuevo conocimiento en CHATBOT';

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: remitente,
    pass: contrasenyaEmail
  }
});

// Inicializacion de parametros de conexión
const app = express();
app.set('Puerto', process.env.PORT || 3000);

// Inicio de conexion con la base de datos
mongoose.connect(enlace, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Base de datos conectada'))
  .catch(e => console.log(e));

// Declaracion de respùestas del sistema
let modoAyudaError = ['No tengo información sobre eso', 'Lo siento no puedo ayudarte', 'No tengo conocimiento sobre ese tema'];
let finalConversacion = ['Si necesitas alguna cosa más, dimelo', 'Si puedo hacer algo más por ti, no dudes en decirmelo', 'Puedes preguntarme dudas o añadirme más conocimiento'];
let salirModoEntrenamiento = ['SALIR', 'PARAR', 'REINICIAR', 'PARA', 'DETENER', 'ABANDONAR', 'CANCELAR', 'CANCELA'];
let resDescripcionEntrenamiento = ['De acuerdo, Adjunta un enlace con información adicional', 'Perfecto, Añade una página donde consultar más información'];
let resModoGuia = ['ayudame con la POO', 'vamos a entrenar', 'que me puedes decir sobre los bucles?', 'quiero entrenarte', 'como se declara un float?', 'hora de entrenar', 'que es un constructor?'];
let easterEggFrases = ['Pero, ¿qué has hecho esbirro? Esos eran seres humanos con familias y... Nah, es broma. Que les den a esos cretinos.', 'Tu capacidad de caminar distancias cortas sin morir conseguirá acabar con Jack el Guapo.', '¡Maldito seas, Jack! ¿Cómo sabías que las escaleras son mi único punto débil? Además de la electrocución, las explosiones, las balas, el óxido, la corrosión, las patadas fuertes, los virus, los insultos, las caídas desde muy alto, el agua, la diabetes del adulto, las miradas raras; los infartos, la exposición al oxígeno, el rechazo de una mujer y mi alergia a las mascotas. ¡Ah, y tu ingenio sólo se ve superado por tu maldad!'];
let noEnlaceEntrenamiento = ['NO, GRACIAS', 'NO', 'NO LO CREO', 'NO ME INTERESA', 'NEGATIVO', 'GRACIAS PERO NO', 'NO HACERLO', 'NO QUIERO'];
let preguntaAyuda = ['¿Sobre que tienes dudas?', '¿Podrías concretarme tu duda?', '¿Cuál es tu duda?'];

app.use(express.static('public'));

app.post('/', express.json(), function (req, res) {
  const agent = new WebhookClient({ request: req, response: res });
  //console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  //console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

  function inicioDeConversacion(agent) {
    console.log('Despertando...');
    agent.add('');
  }

  async function registrarAcceso() {
    var medioAcceso = '';
    if (req.body.originalDetectIntentRequest.source == null || req.body.originalDetectIntentRequest.source == undefined) {
      medioAcceso = 'web';
    } else {
      medioAcceso = req.body.originalDetectIntentRequest.source;
    }

    var registro = await Acceso.findOne({ medio: medioAcceso, fecha: moment().format('YYYY-MM-DD') }).exec();

    if (registro == null) {
      var accesoModel = new Acceso({
        medio: medioAcceso,
        fecha: moment().format('YYYY-MM-DD'),
        contador: 1
      });

      await accesoModel.save();
    } else {
      await Acceso.updateOne({ medio: medioAcceso, fecha: moment().format('YYYY-MM-DD') }, { $set: { contador: registro.contador + 1 } });
    }
  }

  async function modoAyuda(agent) {
    var categoria = req.body.queryResult.parameters.categoria[0].toUpperCase();

    if (categoria == null) {
      var respuestaAyuudaRandom = Math.floor(Math.random() * preguntaAyuda.length);
      agent.add(preguntaAyuda[respuestaAyuudaRandom]);
    } else {

      registrarAcceso();

      if (categoria == 'GENERICA') {
        var resultados = await Conocimiento.aggregate([{ $sample: { size: 3 } }]);

        try {
          agent.add('Esto es un ejemplo de las cosas que sé');
          for (var i = 0; i < 3; i++) {
            agent.add(resultados[i].descripcion);
            agent.add(resultados[i].enlace);
          }
        } catch (error) {
          var respuestaErrorRandom = Math.floor(Math.random() * modoAyudaError.length);
          agent.add(modoAyudaError[respuestaErrorRandom]);
        }
      } else {
        var resultado = await Conocimiento.findOne({ categoria: categoria }).exec();

        if (resultado == null) {
          if (categoria[categoria.length - 2] == 'E' && categoria[categoria.length - 1] == 'S') {
            categoria = categoria.substring(0, categoria.length - 2);
            resultado = await Conocimiento.findOne({ categoria: categoria }).exec();
          } else if (categoria[categoria.length - 1] == 'S') {
            categoria = categoria.substring(0, categoria.length - 1);
            resultado = await Conocimiento.findOne({ categoria: categoria }).exec();
          } else {
            categoria = categoria + 'S';
            resultado = await Conocimiento.findOne({ categoria: categoria }).exec();

            if (resultado == null) {
              categoria = categoria + 'ES';
              resultado = await Conocimiento.findOne({ categoria: categoria }).exec();
            }
          }
        }

        try {
          agent.add(resultado.descripcion);
          agent.add(resultado.enlace);
        } catch (error) {
          var respuestaErrorRandom = Math.floor(Math.random() * modoAyudaError.length);
          agent.add(modoAyudaError[respuestaErrorRandom]);
        }
      }
    }

    var respuestaFinalRandom = Math.floor(Math.random() * finalConversacion.length);
    agent.add(finalConversacion[respuestaFinalRandom]);
  }

  function categoriaEntrenamiento(agent) {
    const categoria = req.body.queryResult.parameters.categoria;

    registrarAcceso();

    if (salirModoEntrenamiento.includes(categoria.toUpperCase())) {
      agent.setFollowupEvent('actions_intent_cancel');
      agent.add('');
    } else {
      agent.add('De acuerdo, ¿Qué me puedes decir sobre ' + categoria + '?');
    }
  }

  function descripcionEntrenamiento(agent) {
    const descripcion = req.body.queryResult.parameters.descripcion;

    if (salirModoEntrenamiento.includes(descripcion.toUpperCase())) {
      agent.setFollowupEvent('actions_intent_cancel');
      agent.add('');
    } else {
      var resDesEntrenamientoRandom = Math.floor(Math.random() * resDescripcionEntrenamiento.length);
      agent.add(resDescripcionEntrenamiento[resDesEntrenamientoRandom]);
    }
  }

  async function enlaceEntrenamiento(agent) {
    var respuesta;
    var enlaceRespuesta;

    if (req.body.queryResult.parameters.residual.length > 0) {
      respuesta = req.body.queryResult.parameters.residual.toUpperCase();
    } else {
      respuesta = '';
    }
    if (req.body.queryResult.parameters.enlace.length > 0) {
      enlaceRespuesta = req.body.queryResult.parameters.enlace.toLowerCase();
    } else {
      enlaceRespuesta = '';
    }

    if (salirModoEntrenamiento.includes(respuesta)) {
      agent.setFollowupEvent('actions_intent_cancel');
      agent.add('');
    } else if (!noEnlaceEntrenamiento.includes(respuesta) && enlaceRespuesta == '') {
      var respuestaNoEnlace = Math.floor(Math.random() * noEnlaceEntrenamiento.length);
      agent.setFollowupEvent('actions_intent_retry_enlace');
      agent.add('Por favor, adjunte un enlace o en el caso de no querer hacerlo indicamelo, por ejemplo "' + noEnlaceEntrenamiento[respuestaNoEnlace].toLowerCase() + '".');
    } else {
      agent.setFollowupEvent('actions_intent_finEntrenamiento');
      var respuestaFinalRandom = Math.floor(Math.random() * finalConversacion.length);
      agent.add(finalConversacion[respuestaFinalRandom]);
      agent.end('Fin');

      var conocimientoModel = new Conocimiento({
        categoria: req.body.queryResult.parameters.categoria.toUpperCase(),
        descripcion: req.body.queryResult.parameters.descripcion,
        enlace: enlaceRespuesta
      });

      var mensaje = "";

      try {
        await conocimientoModel.save();

        mensaje = "Se han añadido cambios al chatbot." + '\n' + '\n';
        mensaje = mensaje + "Categoria: " + req.body.queryResult.parameters.categoria.toUpperCase() + '\n';
        mensaje = mensaje + "Descripcion: " + req.body.queryResult.parameters.descripcion + '\n';
        mensaje = mensaje + "Enlace: " + enlaceRespuesta;
      } catch (err) {
        mensaje = "Se ha producido un error en la inserción de datos.";
      }

      var opcionesEmail = {
        from: remitente,
        to: destinatario,
        subject: asunto,
        text: mensaje
      }

      transporter.sendMail(opcionesEmail, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email enviado: ' + info.response);
        }
      });
    }
  }

  function modoGuia(agent) {
    registrarAcceso();

    var respuestaGuia = Math.floor(Math.random() * resModoGuia.length);
    var respuesta1 = 'Para interaccionar conmigo puedes decirme "' + resModoGuia[respuestaGuia] + '" o "';

    if (respuestaGuia == resModoGuia.length) {
      respuestaGuia = respuestaGuia - 1;
    } else {
      respuestaGuia = respuestaGuia + 1;
    }

    respuesta1 = respuesta1 + resModoGuia[respuestaGuia] + '".';
    respuesta2 = 'Para poder entrenarme debes de intorducir un tema o categoria, una breve descripción y un enlace si lo deseas. \n';
    var respuestaNoEnlace = Math.floor(Math.random() * noEnlaceEntrenamiento.length);
    respuesta2 = respuesta2 + 'En caso de no querer adjuntar un enlace responde negativamente. Por ejemplo: "' + noEnlaceEntrenamiento[respuestaNoEnlace].toLowerCase() + '".'

    var respuesta3 = 'Si no sabes muy bien que preguntar puedes decirme "que cosas sabes" o "que conoces"';

    agent.add(respuesta1);
    agent.add(respuesta2);
    agent.add(respuesta3);
  }

  function easterEgg(agent) {
    registrarAcceso();

    var fraseAleatoria = Math.floor(Math.random() * easterEggFrases.length);
    var frase = easterEggFrases[fraseAleatoria];
    agent.add(frase);
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('modoAyuda', modoAyuda);
  intentMap.set('categoriaEntrenamiento', categoriaEntrenamiento);
  intentMap.set('descripcionEntrenamiento', descripcionEntrenamiento);
  intentMap.set('enlaceEntrenamiento', enlaceEntrenamiento);
  intentMap.set('Inicio_de_conversacion', inicioDeConversacion);
  intentMap.set('modoGuia', modoGuia);
  intentMap.set('easterEgg', easterEgg);

  agent.handleRequest(intentMap);
})

app.listen(app.get('Puerto'), () => {
  console.log('Servidor funcionando en el puerto ' + app.get('Puerto'));
});